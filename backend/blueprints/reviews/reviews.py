from flask import Blueprint, request, make_response, jsonify
from decorators import jwt_required, admin_required
from bson import ObjectId

import globals

reviews_bp = Blueprint("reviews_bp", __name__)

products_collection = globals.db.products

# =====================================================
# ADD A NEW REVIEW
# =====================================================
@reviews_bp.route('/api/v1.0/products/<string:p_id>/reviews', methods=['POST'])
@jwt_required
def add_new_review(p_id):
    if not ObjectId.is_valid(p_id):
        return make_response(jsonify({"error": "Invalid product ID format"}), 400)

    data = request.json

    if not data or not data.get("username") or not data.get("comment") or not data.get("stars"):
        return make_response(jsonify({"error": "Missing required fields (username, comment, stars)"}), 400)

    try:
        stars = int(data["stars"])
        if stars < 1 or stars > 5:
            return make_response(jsonify({"error": "Stars should be between 1 and 5"}), 400)
    except ValueError:
        return make_response(jsonify({"error": "Stars must be a numeric value"}), 400)
    

    product = products_collection.find_one({"_id": ObjectId(p_id)})
    if not product:
        return make_response(jsonify({"error": "Product not found"}), 404)

    new_review_id = ObjectId()
    new_review = {
        "_id": new_review_id,
        "username": data.get("username"),
        "comment": data.get("comment"),
        "stars": stars
    }


    products_collection.update_one(
        {"_id": ObjectId(p_id)},
        {"$push": {"reviews": new_review}}
    )

    new_review_link = f"http://127.0.0.1:5000/api/v1.0/products/{p_id}/reviews/{str(new_review_id)}"

    return make_response(jsonify({"URL": new_review_link}), 201)

# =====================================================
# GET ALL REVIEWS FOR A PRODUCT (Public)
# =====================================================
@reviews_bp.route("/api/v1.0/products/<string:p_id>/reviews", methods=['GET'])
def fetch_all_reviews(p_id):
    if not ObjectId.is_valid(p_id):
        return make_response(jsonify({"error": "Invalid product ID format"}), 400)

    data_to_return = []
    product = products_collection.find_one({ "_id": ObjectId(p_id) }, { "reviews": 1, "_id": 0 })
    
    if not product or 'reviews' not in product:
        return make_response(jsonify([]), 200)

    for review in product['reviews']:
        review['_id'] = str(review['_id'])
        data_to_return.append(review)
    
    return make_response(jsonify(data_to_return), 200)

# =====================================================
# GET A SINGLE REVIEW (Public)
# =====================================================
@reviews_bp.route("/api/v1.0/products/<string:p_id>/reviews/<string:r_id>", methods=['GET'])
def fetch_one_review(p_id, r_id):
    if not ObjectId.is_valid(p_id) or not ObjectId.is_valid(r_id):
        return make_response(jsonify({"error": "Invalid ID format"}), 400)

    product = products_collection.find_one(
        { "reviews._id": ObjectId(r_id), "_id": ObjectId(p_id) },
        { "_id": 0, "reviews.$": 1 }
    )

    if product is None:
        return make_response(jsonify({ "error": "Invalid Product ID or Review ID" }), 404)

    product['reviews'][0]['_id'] = str(product['reviews'][0]['_id'])

    return make_response(jsonify(product['reviews'][0]), 200)

# =====================================================
# UPDATE A REVIEW (Protected)
# =====================================================
@reviews_bp.route("/api/v1.0/products/<string:p_id>/reviews/<string:r_id>", methods=['PUT'])
@jwt_required
def edit_review(p_id, r_id):
    if not ObjectId.is_valid(p_id) or not ObjectId.is_valid(r_id):
        return make_response(jsonify({"error": "Invalid ID format"}), 400)

    data = request.json
    update_fields = {}

    if data.get("username"):
        update_fields["reviews.$.username"] = data["username"]
    if data.get("comment"):
        update_fields["reviews.$.comment"] = data["comment"]
    if data.get("stars"):
        try:
            stars = int(data["stars"])
            if 1 <= stars <= 5:
                update_fields["reviews.$.stars"] = stars
            else:
                return make_response(jsonify({"error": "Stars should be between 1 and 5"}), 400)
        except ValueError:
            return make_response(jsonify({"error": "Stars must be a numeric value"}), 400)

    if not update_fields:
        return make_response(jsonify({"error": "No valid fields to update"}), 400)

    result = products_collection.update_one(
        {
            "_id": ObjectId(p_id),  
            "reviews._id": ObjectId(r_id)  
        },
        {
            "$set": update_fields 
        }
    )

    if result.modified_count == 0:
        return make_response(jsonify({"error": "Review or Product not found, or no changes made"}), 404)

    edited_review_url = f"http://127.0.0.1:5000/api/v1.0/products/{p_id}/reviews/{r_id}"
    return make_response(jsonify({"url": edited_review_url}), 200)

# =====================================================
# DELETE A REVIEW (Protected)
# =====================================================
@reviews_bp.route("/api/v1.0/products/<string:p_id>/reviews/<string:r_id>", methods=['DELETE'])
@jwt_required
def delete_review(p_id, r_id):
    if not ObjectId.is_valid(p_id) or not ObjectId.is_valid(r_id):
        return make_response(jsonify({"error": "Invalid ID format"}), 400)

    result = products_collection.update_one(
        { "_id": ObjectId(p_id) },
        { "$pull": { "reviews": { "_id": ObjectId(r_id) } } }
    )

    if result.modified_count == 0:
        return make_response(jsonify({"error": "Review or Product not found"}), 404)

    return make_response(jsonify({"message": "Review deleted successfully"}), 200)
# =====================================================
# DELETE OWN REVIEW BY REVIEW ID
# =====================================================
@reviews_bp.route("/api/v1.0/user/reviews/<string:r_id>", methods=['DELETE'])
@jwt_required
def delete_own_review(r_id):
    if not ObjectId.is_valid(r_id):
        return make_response(jsonify({"error": "Invalid review ID format"}), 400)

    result = products_collection.update_one(
        {"reviews._id": ObjectId(r_id)},
        {"$pull": {"reviews": {"_id": ObjectId(r_id)}}}
    )

    if result.modified_count == 0:
        return make_response(jsonify({"error": "Review not found"}), 404)

    return make_response(jsonify({"message": "Review deleted successfully"}), 200)