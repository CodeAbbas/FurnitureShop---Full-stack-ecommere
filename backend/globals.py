from pymongo import MongoClient

# Connect to your local MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client.selectionDB

SECRET_KEY = "selection_secret_key_2026"
