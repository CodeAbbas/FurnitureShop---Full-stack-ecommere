import random
import json
import urllib.parse
from bson import ObjectId

category_keywords = {
    'Sofas': 'couch,sofa,living-room',
    'Beds': 'bedroom,bed,mattress',
    'Tables': 'dining-table,desk,coffee-table',
    'Chairs': 'chair,armchair,seating',
    'Wardrobes': 'closet,wardrobe,cabinet',
    'Desks': 'office-desk,workspace',
    'Armchairs': 'armchair,reading-nook',
    'Ottomans': 'ottoman,footstool',
    'Sideboards': 'sideboard,credenza',
    'TV Units': 'tv-stand,entertainment-center'
}

subcategories_map = {
    'Sofas': ['Corner Sofa', '2-Seater Sofa', '3-Seater Sofa', 'Sofa Bed', 'Loveseat'],
    'Beds': ['Single Bed', 'Double Bed', 'King Size Bed', 'Super King', 'Bunk Bed'],
    'Tables': ['Dining Table', 'Coffee Table', 'Side Table', 'Console Table'],
    'Chairs': ['Dining Chair', 'Office Chair', 'Lounge Chair', 'Bar Stool'],
    'Wardrobes': ['2-Door Wardrobe', '3-Door Wardrobe', 'Sliding Door', 'Mirrored'],
    'Desks': ['Computer Desk', 'Writing Desk', 'Standing Desk', 'Corner Desk'],
    'Armchairs': ['Recliner', 'Accent Chair', 'Wingback Chair', 'Tub Chair'],
    'Ottomans': ['Storage Ottoman', 'Pouffe', 'Footstool'],
    'Sideboards': ['2-Door Sideboard', '3-Door Sideboard', 'Display Cabinet'],
    'TV Units': ['Corner TV Unit', 'Wall Mounted', 'Lowboard', 'Entertainment Center']
}

def generate_furniture_data():
    categories = list(category_keywords.keys())
    adjectives = ['Modern', 'Classic', 'Rustic', 'Minimalist', 'Luxury', 'Vintage', 'Contemporary', 'Industrial', 'Scandinavian', 'Mid-Century']
    materials = ['Oak', 'Pine', 'Metal', 'Glass', 'Leather', 'Velvet', 'Walnut', 'Teak', 'Marble', 'Linen', 'Plush Velvet']
    
    product_list = []
    
    for i in range(100):
        category = random.choice(categories)
        subcategory = random.choice(subcategories_map[category])

        title_category = category[:-1] if category.endswith('s') else category
        title = f"{random.choice(adjectives)} {random.choice(materials)} {title_category}"
        
        price = round(random.uniform(50.0, 999.99), 2)

        keywords = category_keywords.get(category, 'furniture')

        encoded_title = urllib.parse.quote(title)

        image_providers = [
            f"https://loremflickr.com/800/600/{keywords}?lock={i}",
            f"https://picsum.photos/seed/{category.replace(' ', '')}{i}/800/600",
            f"https://placehold.co/800x600/e2e8f0/475569?text={encoded_title}"
        ]
        
        image_url = random.choice(image_providers)

        reviews = []
        for j in range(random.randint(0, 3)):
            reviews.append({
                "_id": str(ObjectId()),
                "username": f"customer_{random.randint(100, 999)}",
                "comment": random.choice([
                    "Great quality, highly recommend!", 
                    "Looks beautiful in my living room.", 
                    "A bit overpriced, but solid.", 
                    "Exactly as pictured on the website.", 
                    "Delivery was fast and assembly was easy.",
                    "The fabric feels very premium and durable.",
                    "A bit smaller than I expected, but fits the space.",
                    "Perfect for my home office setup.",
                    "The cushions are quite firm but very supportive.",
                    "The color is slightly darker than the photos, but still nice.",
                    "Excellent craftsmanship, you can tell it’s built to last.",
                    "Took two people to assemble, but the instructions were clear.",
                    "My cat loves it more than I do!",
                    "The wood finish is absolutely stunning.",
                    "Very modern and sleek design. Five stars.",
                    "Wait time for delivery was long, but worth it.",
                    "Super comfortable for long movie nights.",
                    "Great value for money compared to high-street brands.",
                    "Fits the aesthetic of my apartment perfectly.",
                    "Packaging was very secure, no scratches or damage."
                ]),
                "stars": random.randint(3, 5)
            })

        product_list.append({
            "title": title,
            "category": category,
            "subcategory": subcategory,
            "price": price,
            "oldPrice": round(price * 1.2, 2),
            "inStock": random.randint(0, 50),
            "topSelling": random.choice([True, False]),
            "newArrival": random.choice([True, False]),
            "description": f"A high-quality, beautifully crafted {title.lower()} designed to elevate your home decor.",
            "specification": "Standard dimensions apply. See manual for assembly instructions.",
            "images": [image_url],
            "reviews": reviews,
            "variations": []
        })
        
    return product_list

if __name__ == "__main__":
    products = generate_furniture_data()

    with open("data.json", "w") as fout:
        json.dump(products, fout, indent=4)
        
    print("Successfully generated 100 furniture products with multi-site dummy images and saved to data.json")