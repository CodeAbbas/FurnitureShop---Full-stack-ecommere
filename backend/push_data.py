from pymongo import MongoClient
import bcrypt
import json
import globals 

def push_initial_data():
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client.selectionDB
    
    # =====================================================
    # 1. PUSH USERS (Create Admin & Test Customer)
    # =====================================================
    users_collection = db.users
    users_collection.delete_many({})
    
    admin_pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt())
    customer_pw = bcrypt.hashpw(b"customer123", bcrypt.gensalt())
    
    user_list = [
        {
            "username": "Admin Abbas",
            "email": "admin@selection.com",
            "password": admin_pw,
            "admin": True,
            "cart": []
        },
        {
            "username": "Test Customer",
            "email": "customer@selection.com",
            "password": customer_pw,
            "admin": False,
            "cart": []
        }
    ]
    users_collection.insert_many(user_list)
    print("Users pushed successfully.")
    print("--> Admin Login: admin@selection.com / admin123")
    print("--> Customer Login: customer@selection.com / customer123")

    # =====================================================
    # 2. PUSH PRODUCTS (From data.json)
    # =====================================================
    products_collection = db.products
    products_collection.delete_many({}) # Clear existing products
    
    try:
        with open('data.json', 'r') as file:
            product_data = json.load(file)
            
            if product_data:
                products_collection.insert_many(product_data)
                print(f"Successfully pushed {len(product_data)} products to the database.")
            else:
                print("data.json is empty.")
    except FileNotFoundError:
        print("Error: data.json not found. Please run dummy_data.py first.")

if __name__ == "__main__":
    push_initial_data()