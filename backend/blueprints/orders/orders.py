from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required, admin_required
from bson import ObjectId
import jwt
import datetime
import globals

orders_bp = Blueprint("orders_bp", __name__)

users_collection = globals.db.users
orders_collection = globals.db.orders

#Getting the logged-in user's ID
def get_user_id_from_token():
    token = request.headers.get('x-access-token')
    data = jwt.decode(token, globals.SECRET_KEY, algorithms='HS256')
    return data['user_id']

# =====================================================
# CHECKOUT: CONVERT CART TO ORDER
# =====================================================
@orders_bp.route('/api/v1.0/user/checkout', methods=['POST'])
@jwt_required
def process_checkout():
    user_id = get_user_id_from_token()

    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"cart": 1})
    
    if not user or not user.get('cart') or len(user['cart']) == 0:
        return make_response(jsonify({"error": "Cannot checkout, your cart is empty"}), 400)

    cart_items = user['cart']

    total_amount = sum(item.get('subtotal', 0) for item in cart_items)

    new_order = {
        "user_id": ObjectId(user_id),
        "items": cart_items, 
        "totalAmount": total_amount,
        "status": "Pending",
        "createdAt": datetime.datetime.now(datetime.UTC).isoformat()
    }

    result = orders_collection.insert_one(new_order)

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"cart": []}}
    )

    return make_response(jsonify({
        "message": "Checkout successful, order placed",
        "order_id": str(result.inserted_id)
    }), 201)

# =====================================================
# GET CUSTOMER'S PAST ORDERS
# =====================================================
@orders_bp.route('/api/v1.0/user/orders', methods=['GET'])
@jwt_required
def get_user_orders():
    user_id = get_user_id_from_token()

    orders_cursor = orders_collection.find({"user_id": ObjectId(user_id)})
    data_to_return = []

    for order in orders_cursor:
        order['_id'] = str(order['_id'])
        order['user_id'] = str(order['user_id'])
        for item in order.get('items', []):
            item['_id'] = str(item['_id'])
            item['product_id'] = str(item['product_id'])
            
        data_to_return.append(order)

    return make_response(jsonify(data_to_return), 200)

# =====================================================
# GET ALL ORDERS (ADMIN ONLY)
# =====================================================
@orders_bp.route('/api/v1.0/admin/orders', methods=['GET'])
@jwt_required
@admin_required
def get_all_orders_admin():
    orders_cursor = orders_collection.find()
    data_to_return = []

    for order in orders_cursor:
        order['_id'] = str(order['_id'])
        order['user_id'] = str(order['user_id'])
        for item in order.get('items', []):
            item['_id'] = str(item['_id'])
            item['product_id'] = str(item['product_id'])
            
        data_to_return.append(order)

    return make_response(jsonify(data_to_return), 200)

# =====================================================
# UPDATE ORDER STATUS (ADMIN ONLY)
# =====================================================
@orders_bp.route('/api/v1.0/admin/orders/<string:o_id>', methods=['PUT'])
@jwt_required
@admin_required
def update_order_status(o_id):
    if not ObjectId.is_valid(o_id):
        return make_response(jsonify({"error": "Invalid order ID format"}), 400)

    data = request.json
    if not data or not data.get("status"):
        return make_response(jsonify({"error": "status field is required"}), 400)

    result = orders_collection.update_one(
        {"_id": ObjectId(o_id)},
        {"$set": {"status": data["status"]}}
    )

    if result.modified_count == 0:
        return make_response(jsonify({"error": "Order not found or status is already the same"}), 404)

    return make_response(jsonify({"message": f"Order status updated to {data['status']}"}), 200)
# =====================================================
# ADMIN DASHBOARD METRICS (Admin Only)
# =====================================================
@orders_bp.route('/api/v1.0/admin/dashboard', methods=['GET'])
@jwt_required
@admin_required
def get_dashboard_metrics():
    try:
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "totalRevenue": {"$sum": "$totalAmount"},
                    "totalOrders": {"$sum": 1}
                }
            }
        ]

        order_metrics = list(orders_collection.aggregate(pipeline))

        total_products = globals.db.products.count_documents({})
        total_users = globals.db.users.count_documents({})

        dashboard_data = {
            "totalRevenue": round(order_metrics[0]["totalRevenue"], 2) if order_metrics else 0,
            "totalOrders": order_metrics[0]["totalOrders"] if order_metrics else 0,
            "totalProducts": total_products,
            "totalUsers": total_users
        }

        return make_response(jsonify(dashboard_data), 200)

    except Exception as e:
        return make_response(jsonify({"error": "Internal Server Error", "details": str(e)}), 500)