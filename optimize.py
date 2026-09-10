# optimize.py
import asyncio
from pymongo import ASCENDING, DESCENDING
from database import articles_collection, history_collection

async def create_indexes():
    print("Creating indexes...")
    
    # 1. Multi-key index on tags for fast recommendation filtering
    await articles_collection.create_index([("tags", ASCENDING)])
    print("- Created index on Articles: 'tags'")
    
    # 2. Single-field index on views for fast sorting of trending articles
    await articles_collection.create_index([("views", DESCENDING)])
    print("- Created index on Articles: 'views'")
    
    # 3. Compound index on userId and readAt for rapid reading history lookups
    await history_collection.create_index([("userId", ASCENDING), ("readAt", DESCENDING)])
    print("- Created compound index on ReadingHistories: 'userId' & 'readAt'")
    
    print("\nAll indexes successfully created!")

if __name__ == "__main__":
    asyncio.run(create_indexes())