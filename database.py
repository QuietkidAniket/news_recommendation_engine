# database.py
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_DETAILS = "mongodb+srv://aniketkundu2023_db_user:7UPlzSAnvPuo5uB2@cluster0.lm8g28x.mongodb.net/?appName=Cluster0" # Replace with Atlas URI if using cloud
client = AsyncIOMotorClient(MONGO_DETAILS)

# Database Name
database = client.news_recommendation_db

# Collections
users_collection = database.get_collection("Users")
articles_collection = database.get_collection("Articles")
history_collection = database.get_collection("ReadingHistories")