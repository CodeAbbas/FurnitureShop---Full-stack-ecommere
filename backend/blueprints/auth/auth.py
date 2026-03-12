from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required
import bcrypt
import jwt
import datetime
from bson import ObjectId

import globals

auth_bp = Blueprint("auth_bp", __name__)

users_collection = globals.db.users
blacklist = globals.db.blacklist

# ==================================================
# REGISTER USER
# ==================================================
@auth_bp.route('/api/v1.0/guest/register', methods=['POST'])
def register():
    data = request.json

    if not data or not data.get("username") or not data.get("email") or not data.get("password"):
        return make_response(jsonify({"error": "Missing required fields (username, email, password)"}), 400)

    if users_collection.find_one({"email": data["email"]}):
        return make_response(jsonify({"error": "User with this email already exists"}), 400)

    hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())

    new_user = {
        "username": data["username"],
        "email": data["email"],
        "password": hashed_password,
        "admin": False,  
        "cart": []
    }

    result = users_collection.insert_one(new_user)
    
    return make_response(jsonify({
        "message": "User registered successfully", 
        "user_id": str(result.inserted_id)
    }), 201)

# =====================================================
# LOGIN USER
# =====================================================
@auth_bp.route('/api/v1.0/guest/login', methods=['POST'])
def login():
    data = request.json

    if not data or not data.get("email") or not data.get("password"):
        return make_response(jsonify({"error": "Email and password required"}), 400)

    user = users_collection.find_one({"email": data["email"]})

    if user and bcrypt.checkpw(data["password"].encode('utf-8'), user["password"]):
        # Generate JWT token
        token = jwt.encode({
            'user_id': str(user['_id']),
            'username': user['username'],
            'admin': user['admin'],
            'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2) # Token expires in 2 hours
        }, globals.SECRET_KEY, algorithm='HS256')

        return make_response(jsonify({
            'message': 'Login successful', 
            'token': token,
            'admin': user['admin']
        }), 200)

    return make_response(jsonify({'error': 'Invalid email or password'}), 401)

# =====================================================
# LOGOUT USER
# =====================================================
@auth_bp.route('/api/v1.0/user/logout', methods=['GET'])
@jwt_required
def logout():
    token = request.headers['x-access-token']
    blacklist.insert_one({'token': token})
    
    return make_response(jsonify({'message': 'Logout successful'}), 200)