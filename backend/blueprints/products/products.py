from decorators import jwt_required, admin_required
from flask import Blueprint, request, make_response, jsonify
from bson import ObjectId
import globals

products_bp = Blueprint("products_bp", __name__)

products_collection = globals.db.products


# =====================================================
# GET ALL PRODUCTS (Public) — supports ?category= and pagination
# =====================================================
@products_bp.route('/api/v1.0/products', methods=['GET'])
def get_all_products():
    data_to_return = []
    page_num = request.args.get('pn', default=1, type=int)
    page_size = request.args.get('ps', default=10, type=int)
    page_start = (page_num - 1) * page_size

    query_filter = {}
    category = request.args.get('category')
    if category:
        query_filter['category'] = {'$regex': category, '$options': 'i'}

    try:
        products_cursor = products_collection.find(query_filter).skip(page_start).limit(page_size)

        for product in products_cursor:
            product['_id'] = str(product['_id'])
            for review in product.get('reviews', []):
                review['_id'] = str(review['_id'])
            data_to_return.append(product)

        return make_response(jsonify(data_to_return), 200)

    except ConnectionError:
        return make_response(jsonify({"error": "Database connection error"}), 500)
    except Exception as e:
        return make_response(jsonify({"error": "Internal Server Error", "details": str(e)}), 500)


# =====================================================
# GET ONE PRODUCT (Public)
# =====================================================
@products_bp.route('/api/v1.0/products/<string:p_id>', methods=['GET'])
def get_one_product(p_id):
    if not ObjectId.is_valid(p_id):
        return make_response(jsonify({"error": "Invalid product ID format"}), 400)

    product = products_collection.find_one({"_id": ObjectId(p_id)})
    if product is not None:
        product["_id"] = str(product["_id"])
        for review in product.get("reviews", []):
            review["_id"] = str(review["_id"])
        return make_response(jsonify(product), 200)
    else:
        return make_response(jsonify({"error": "Product not found"}), 404)


# =====================================================
# ADD PRODUCT (Admin only)
# =====================================================
@products_bp.route('/api/v1.0/admin/products', methods=['POST'])
@jwt_required
@admin_required
def add_product():
    data = request.form
    if data and "title" in data and "price" in data and "category" in data:
        new_product = {
            "title": data.get("title"),
            "category": data.get("category"),
            "subcategory": data.get("subcategory", ""),
            "price": float(data.get("price", 0.0)),
            "oldPrice": float(data.get("oldPrice", 0.0)),
            "inStock": int(data.get("inStock", 0)),
            "topSelling": data.get("topSelling", "false").lower() == "true",
            "newArrival": data.get("newArrival", "false").lower() == "true",
            "description": data.get("description", ""),
            "specification": data.get("specification", ""),
            "images": [],
            "reviews": [],
            "variations": []
        }
        result = products_collection.insert_one(new_product)
        new_product_id = str(result.inserted_id)
        new_product_link = f"http://127.0.0.1:5000/api/v1.0/products/{new_product_id}"
        return make_response(jsonify({"URL": new_product_link}), 201)
    else:
        return make_response(jsonify({"error": "Missing essential product data (title, price, category)"}), 400)


# =====================================================
# EDIT PRODUCT (Admin only)
# =====================================================
@products_bp.route('/api/v1.0/admin/products/<string:p_id>', methods=['PUT'])
@jwt_required
@admin_required
def edit_product(p_id):
    if not ObjectId.is_valid(p_id):
        return make_response(jsonify({"error": "Invalid product ID format"}), 400)

    data = request.form
    update_fields = {}

    if data.get("title"): update_fields["title"] = data.get("title")
    if data.get("category"): update_fields["category"] = data.get("category")
    if data.get("price"): update_fields["price"] = float(data.get("price"))
    if data.get("inStock"): update_fields["inStock"] = int(data.get("inStock"))
    if data.get("description"): update_fields["description"] = data.get("description")

    if not update_fields:
        return make_response(jsonify({"error": "No valid fields to update"}), 400)

    result = products_collection.update_one(
        {"_id": ObjectId(p_id)},
        {"$set": update_fields}
    )

    if result.modified_count == 1:
        updated_product_link = f"http://127.0.0.1:5000/api/v1.0/products/{p_id}"
        return make_response(jsonify({"URL": updated_product_link}), 200)
    else:
        return make_response(jsonify({"message": "No changes made or product not found"}), 200)


# =====================================================
# DELETE PRODUCT (Admin only)
# =====================================================
@products_bp.route('/api/v1.0/admin/products/<string:p_id>', methods=['DELETE'])
@jwt_required
@admin_required
def delete_product(p_id):
    if not ObjectId.is_valid(p_id):
        return make_response(jsonify({"error": "Invalid product ID format"}), 400)

    result = products_collection.delete_one({"_id": ObjectId(p_id)})
    if result.deleted_count == 1:
        return make_response(jsonify({"message": "Product deleted successfully"}), 200)
    else:
        return make_response(jsonify({"error": "Product not found"}), 404)


# =====================================================
# SEARCH PRODUCTS (Public) — searches title, category, subcategory, description
# =====================================================
@products_bp.route('/api/v1.0/guest/search', methods=['GET'])
def search_products():
    query = request.args.get('q', '')

    if not query:
        return make_response(jsonify({"error": "Search query parameter 'q' is required"}), 400)

    search_filter = {
        "$or": [
            {"title":       {"$regex": query, "$options": "i"}},
            {"category":    {"$regex": query, "$options": "i"}},
            {"subcategory": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}}
        ]
    }

    data_to_return = []
    try:
        products_cursor = products_collection.find(search_filter).limit(20)

        for product in products_cursor:
            product['_id'] = str(product['_id'])
            for review in product.get('reviews', []):
                review['_id'] = str(review['_id'])
            data_to_return.append(product)

        return make_response(jsonify(data_to_return), 200)
    except Exception as e:
        return make_response(jsonify({"error": "Internal Server Error", "details": str(e)}), 500)