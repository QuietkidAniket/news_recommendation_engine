# main.py
from fastapi import FastAPI, HTTPException, Body
from fastapi.encoders import jsonable_encoder
from bson import ObjectId
from database import database, articles_collection
from models import Article

app = FastAPI(title="News Recommendation Engine API")

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

# --- CRUD OPERATIONS ---

# 1. CREATE
@app.post("/articles/", response_description="Add new article", response_model=Article)
async def create_article(article: Article = Body(...)):
    article_dict = article.model_dump(by_alias=True, exclude_none=True)
    new_article = await articles_collection.insert_one(article_dict)
    created_article = await articles_collection.find_one({"_id": new_article.inserted_id})
    return created_article

# 2. READ (All)
@app.get("/articles/", response_description="List all articles")
async def list_articles():
    articles = await articles_collection.find().to_list(100)
    return articles

# 3. READ (Single)
@app.get("/articles/{id}", response_description="Get a single article")
async def show_article(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if (article := await articles_collection.find_one({"_id": ObjectId(id)})) is not None:
        return article
    raise HTTPException(status_code=404, detail="Article not found")

# 4. UPDATE (e.g., updating view count or title)
@app.put("/articles/{id}", response_description="Update an article")
async def update_article(id: str, new_title: str = Body(..., embed=True)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_result = await articles_collection.update_one(
        {"_id": ObjectId(id)}, {"$set": {"title": new_title}}
    )
    if update_result.modified_count == 1:
        updated_article = await articles_collection.find_one({"_id": ObjectId(id)})
        return updated_article
    raise HTTPException(status_code=404, detail="Article not found or no changes made")

# 5. DELETE
@app.delete("/articles/{id}", response_description="Delete an article")
async def delete_article(id: str):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    delete_result = await articles_collection.delete_one({"_id": ObjectId(id)})
    if delete_result.deleted_count == 1:
        return {"message": "Article deleted successfully"}
    raise HTTPException(status_code=404, detail="Article not found")