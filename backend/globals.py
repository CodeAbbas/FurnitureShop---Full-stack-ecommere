from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client.selectionDB

SECRET_KEY = "selection_secret_key_2026"
