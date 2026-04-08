import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/taskOrganizerDB")
client = AsyncIOMotorClient(MONGO_URI)
db = client.get_database()

users_collection = db.get_collection("users")
