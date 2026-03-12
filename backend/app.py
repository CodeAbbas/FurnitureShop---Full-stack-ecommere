from flask import Flask
from flask_cors import CORS

from blueprints.products.products import products_bp
from blueprints.auth.auth import auth_bp
from blueprints.reviews.reviews import reviews_bp

app = Flask(__name__)
CORS(app) 

app.register_blueprint(products_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(reviews_bp)

if __name__ == "__main__":
    app.run(debug=True)