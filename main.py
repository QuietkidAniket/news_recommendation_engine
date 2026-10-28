# main.py
from fastapi import FastAPI, HTTPException, Body
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
from database import database, articles_collection
from models import Article, User
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="News Recommendation Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "News Recommendation Engine is running"}

@app.get("/db-status")
async def check_db():
    try:
        await database.command("ping")
        return {"status": "Database connection successful"}
    except Exception as e:
        return {"status": "Database connection failed", "error": str(e)}

# --- ARTICLE CRUD OPERATIONS ---

@app.post("/articles/", response_description="Add new article", response_model=Article)
async def create_article(article: Article = Body(...)):
    article_dict = article.model_dump(by_alias=True, exclude_none=True)
    new_article = await articles_collection.insert_one(article_dict)
    created_article = await articles_collection.find_one({"_id": new_article.inserted_id})
    return Article(**created_article)

@app.get("/articles/", response_description="List all articles", response_model=List[Article])
async def list_articles():
    articles = await articles_collection.find().to_list(100)
    return [Article(**art) for art in articles]

@app.get("/articles/{id}", response_description="Get a single article", response_model=Article)
async def show_article(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if (article := await articles_collection.find_one({"_id": ObjectId(id)})) is not None:
        return Article(**article)
    raise HTTPException(status_code=404, detail="Article not found")

@app.put("/articles/{id}", response_description="Update an article", response_model=Article)
async def update_article(id: str, new_title: str = Body(..., embed=True)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_result = await articles_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": {"title": new_title}}
    )
    if update_result.modified_count == 1:
        updated_article = await articles_collection.find_one({"_id": ObjectId(id)})
        return Article(**updated_article)
    
    if (existing_article := await articles_collection.find_one({"_id": ObjectId(id)})) is not None:
        return Article(**existing_article)
        
    raise HTTPException(status_code=404, detail="Article not found")

@app.delete("/articles/{id}", response_description="Delete an article")
async def delete_article(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    delete_result = await articles_collection.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "Article deleted successfully"}
    raise HTTPException(status_code=404, detail="Article not found")

# --- USER CRUD OPERATIONS ---

# ---> RESTORED GET ENDPOINT FOR USERS <---
@app.get("/users/", response_description="List all users")
async def list_users():
    users = await database.get_collection("Users").find().to_list(100)
    for user in users:
        user["_id"] = str(user["_id"])
    return users

@app.post("/users/", response_description="Create a new user")
async def create_user(user: User = Body(...)):
    user_dict = user.model_dump(by_alias=True, exclude_none=True)
    new_user = await database.get_collection("Users").insert_one(user_dict)
    created_user = await database.get_collection("Users").find_one({"_id": new_user.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    return created_user

@app.delete("/users/{id}", response_description="Delete a user")
async def delete_user(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    delete_result = await database.get_collection("Users").delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "User deleted successfully"}
    raise HTTPException(status_code=404, detail="User not found")

# --- ADVANCED QUERIES & AGGREGATIONS ---

@app.get("/articles/trending/", response_description="Get top 5 trending articles", response_model=List[Article])
async def get_trending_articles():
    pipeline = [
        {"$sort": {"views": -1}},
        {"$limit": 5}
    ]
    trending = await articles_collection.aggregate(pipeline).to_list(5)
    return [Article(**art) for art in trending]

@app.get("/users/{user_id}/recommendations", response_description="Get personalized recommendations", response_model=List[Article])
async def get_recommendations(user_id: str):
    user = await database.get_collection("Users").find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_tags = user.get("preferredTags", [])
    
    pipeline = [
        {"$match": {"tags": {"$in": user_tags}}},
        {"$sort": {"views": -1}},
        {"$limit": 5}
    ]
    recommendations = await articles_collection.aggregate(pipeline).to_list(5)
    return [Article(**art) for art in recommendations]

@app.get("/users/{user_id}/history", response_description="Get user reading history with article details")
async def get_user_history(user_id: str):
    pipeline = [
        {"$match": {"userId": ObjectId(user_id)}},
        {"$sort": {"readAt": -1}},
        {"$lookup": {
            "from": "Articles",
            "localField": "articleId",
            "foreignField": "_id",
            "as": "article_details"
        }},
        {"$unwind": "$article_details"}
    ]
    history = await database.get_collection("ReadingHistories").aggregate(pipeline).to_list(10)
    
    for item in history:
        item["_id"] = str(item["_id"])
        item["userId"] = str(item["userId"])
        item["articleId"] = str(item["articleId"])
        if "article_details" in item:
            item["article_details"]["_id"] = str(item["article_details"]["_id"])
            
    return history

# ---> RESTORED TELEMETRY ENDPOINT <---
class ReadRequest(BaseModel):
    user_id: str

@app.post("/articles/{id}/read", response_description="Log article read")
async def read_article(id: str, payload: ReadRequest):
    if not ObjectId.is_valid(id) or not ObjectId.is_valid(payload.user_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    await articles_collection.update_one(
        {"_id": ObjectId(id)}, {"$inc": {"views": 1}}
    )
    
    await database.get_collection("ReadingHistories").insert_one({
        "userId": ObjectId(payload.user_id),
        "articleId": ObjectId(id),
        "readAt": datetime.utcnow()
    })
    return {"message": "Telemetry logged and views incremented"}