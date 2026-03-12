const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (CSS, JS, etc.)
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Route to handle product form submission (existing)
app.post('/upload/product', upload.array('images', 10), (req, res) => {
    const { title, price, category, subcategory, inStock, topSelling, newArrival, outStock, description, relatedProducts, variations } = req.body;

    // Extract reviews
    const reviews = [];
    for (let i = 1; req.body[`user${i}`]; i++) {
        reviews.push({
            user: req.body[`user${i}`],
            rating: req.body[`rating${i}`],
            comment: req.body[`comment${i}`]
        });
    }

    // Extract image paths
    const images = req.files.map(file => file.path);

    // Parse variations
    const parsedVariations = JSON.parse(variations);

    // Create product object
    const product = {
        id: Date.now(),
        title,
        price: parseFloat(price),
        category,
        subcategory,
        inStock: parseInt(inStock),
        topSelling: topSelling === 'on',
        newArrival: newArrival === 'on',
        outStock: outStock === 'on',
        description,
        specifications: {
            size: parsedVariations.sizes.map(size => size.name).join(', '),
            color: parsedVariations.colors.map(color => color.name).join(', '),
            material: parsedVariations.materials.map(material => material.name).join(', ')
        },
        reviews,
        relatedProducts: relatedProducts.split(',').map(id => parseInt(id.trim())),
        images,
        variations: parsedVariations
    };

    // Read existing products from JSON file
    let products = [];
    if (fs.existsSync('products.json')) {
        products = JSON.parse(fs.readFileSync('products.json', 'utf-8'));
    }

    // Add new product to the list
    products.push(product);

    // Save updated products list to JSON file
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));

    res.sendFile(path.join(__dirname, 'upload', 'product', 'index.html'));
});

// New route to get lookbooks
app.get('/lookbooks', (req, res) => {
    try {
        const lookbooksPath = path.join(__dirname, 'lookbooks.json');
        if (!fs.existsSync(lookbooksPath)) {
            return res.json([]);
        }
        const lookbooks = JSON.parse(fs.readFileSync(lookbooksPath, 'utf-8'));
        res.json(lookbooks);
    } catch (error) {
        console.error('Error reading lookbooks:', error);
        res.status(500).json({ error: 'Failed to load lookbooks' });
    }
});



// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});