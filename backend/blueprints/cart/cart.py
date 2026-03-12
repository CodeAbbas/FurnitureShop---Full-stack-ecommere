from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required
from bson import ObjectId
import jwt
import globals

cart_bp = Blueprint("cart_bp", __name__)

users_collection = globals.db.users
products_collection = globals.db.products

def get_user_id_from_token():
    token = request.headers.get('x-access-token')
    data = jwt.decode(token, globals.SECRET_KEY, algorithms='HS256')
    return data['user_id']

# =====================================================
# GET CURRENT USER'S CART
# =====================================================
@cart_bp.route('/api/v1.0/user/cart', methods=['GET'])
@jwt_required
def get_cart():
    user_id = get_user_id_from_token()
    
    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"cart": 1, "_id": 0})
    
    if not user or 'cart' not in user:
        return make_response(jsonify([]), 200)

    for item in user['cart']:
        item['_id'] = str(item['_id'])
        item['product_id'] = str(item['product_id'])
        
    return make_response(jsonify(user['cart']), 200)

# =====================================================
# ADD ITEM TO CART
# =====================================================
@cart_bp.route('/api/v1.0/user/cart/items', methods=['POST'])
@jwt_required
def add_to_cart():
    user_id = get_user_id_from_token()
    data = request.json

    if not data or not data.get("product_id") or not data.get("quantity"):
        return make_response(jsonify({"error": "product_id and quantity are required"}), 400)

    product_id = data["product_id"]
    quantity = int(data["quantity"])

    if not ObjectId.is_valid(product_id):
        return make_response(jsonify({"error": "Invalid product ID format"}), 400)

    product = products_collection.find_one({"_id": ObjectId(product_id)})
    if not product:
        return make_response(jsonify({"error": "Product not found"}), 404)

    # Calculate subtotal
    subtotal = float(product.get("price", 0)) * quantity

    new_cart_item = {
        "_id": ObjectId(),
        "product_id": ObjectId(product_id),
        "quantity": quantity,
        "subtotal": subtotal
    }

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"cart": new_cart_item}}
    )

    new_cart_item["_id"] = str(new_cart_item["_id"])
    new_cart_item["product_id"] = str(new_cart_item["product_id"])

    return make_response(jsonify({"message": "Item added to cart", "item": new_cart_item}), 201)

# =====================================================
# UPDATE ITEM QUANTITY IN CART
# =====================================================
@cart_bp.route('/api/v1.0/user/cart/items/<string:item_id>', methods=['PUT'])
@jwt_required
def update_cart_item(item_id):
    user_id = get_user_id_from_token()
    data = request.json

    if not ObjectId.is_valid(item_id):
        return make_response(jsonify({"error": "Invalid cart item ID format"}), 400)

    if not data or data.get("quantity") is None:
        return make_response(jsonify({"error": "quantity is required"}), 400)

    try:
        new_quantity = int(data["quantity"])
    except (ValueError, TypeError):
        return make_response(jsonify({"error": "quantity must be a whole number"}), 400)

    if new_quantity < 1:
        return make_response(jsonify({"error": "quantity must be at least 1"}), 400)

    if new_quantity > 100:
        return make_response(jsonify({"error": "quantity cannot exceed 100"}), 400)

    user = users_collection.find_one(
        {"_id": ObjectId(user_id), "cart._id": ObjectId(item_id)},
        {"cart.$": 1}
    )

    if not user or not user.get("cart"):
        return make_response(jsonify({"error": "Item not found in cart"}), 404)

    cart_item = user["cart"][0]
    product = products_collection.find_one({"_id": cart_item["product_id"]})

    if not product:
        return make_response(jsonify({"error": "Original product no longer exists"}), 404)

    new_subtotal = float(product.get("price", 0)) * new_quantity

    users_collection.update_one(
        {"_id": ObjectId(user_id), "cart._id": ObjectId(item_id)},
        {"$set": {
            "cart.$.quantity": new_quantity,
            "cart.$.subtotal": new_subtotal
        }}
    )

    return make_response(jsonify({"message": "Cart item updated successfully"}), 200)

# =====================================================
# REMOVE ITEM FROM CART
# =====================================================
@cart_bp.route('/api/v1.0/user/cart/items/<string:item_id>', methods=['DELETE'])
@jwt_required
def remove_from_cart(item_id):
    user_id = get_user_id_from_token()

    if not ObjectId.is_valid(item_id):
        return make_response(jsonify({"error": "Invalid cart item ID format"}), 400)

    result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"cart": {"_id": ObjectId(item_id)}}}
    )

    if result.modified_count == 0:
        return make_response(jsonify({"error": "Item not found in cart"}), 404)

    return make_response(jsonify({"message": "Item removed from cart"}), 200)