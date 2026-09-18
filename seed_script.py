# seed.py
import asyncio
from datetime import datetime, timedelta
from database import users_collection, articles_collection, history_collection

async def seed_db():
    # 1. Clear existing collections
    await users_collection.delete_many({})
    await articles_collection.delete_many({})
    await history_collection.delete_many({})

    # 2. Insert Users
    users = [
        {"username": "Aniket_K", "preferredTags": ["Technology", "AI", "Cloud"]},
        {"username": "Shubhansh_N", "preferredTags": ["Finance", "Economy"]}
    ]
    user_result = await users_collection.insert_many(users)
    user_ids = user_result.inserted_ids

    # 3. Insert Articles
    articles = [
        {"title": "The Rise of Distributed Systems", "tags": ["Technology", "Cloud"], "views": 1542, "publishedAt": datetime.utcnow()},
        {"title": "Market Trends in Q3 2026", "tags": ["Finance", "Economy"], "views": 3200, "publishedAt": datetime.utcnow()},
        {"title": "Optimizing AI Models", "tags": ["Technology", "AI"], "views": 2100, "publishedAt": datetime.utcnow()}
    ]
    article_result = await articles_collection.insert_many(articles)
    article_ids = article_result.inserted_ids

    # 4. Insert Reading Histories (Linking User IDs to Article IDs)
    histories = [
        {"userId": user_ids[0], "articleId": article_ids[0], "readAt": datetime.utcnow() - timedelta(days=2)},
        {"userId": user_ids[0], "articleId": article_ids[2], "readAt": datetime.utcnow() - timedelta(hours=5)},
        {"userId": user_ids[1], "articleId": article_ids[1], "readAt": datetime.utcnow() - timedelta(minutes=30)}
    ]
    await history_collection.insert_many(histories)
    
    print("Database successfully created and seeded!")

if __name__ == "__main__":
    asyncio.run(seed_db())