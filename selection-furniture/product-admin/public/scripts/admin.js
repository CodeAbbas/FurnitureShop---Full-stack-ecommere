document.getElementById('product-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Gather form data
    const imageUrls = Array.from(document.querySelectorAll('.image-url')).map(input => input.value);
    
    const productData = {
        id: Date.now(), // Generate a unique ID based on the current timestamp
        title: document.getElementById('title').value,
        images: imageUrls, // Store the array of image URLs
        price: document.getElementById('price').value,
        category: document.getElementById('category').value,
        subcategory: document.getElementById('subcategory').value,
        inStock: parseInt(document.getElementById('inStock').value), // Convert to number
        topSelling: document.getElementById('topSelling').checked,
        newArrival: document.getElementById('newArrival').checked,
        outStock: document.getElementById('outStock').checked,
        description: document.getElementById('description').value,
        specifications: {
            Size: document.getElementById('size').value,
            Color: document.getElementById('color').value,
            Material: document.getElementById('material').value,
        },
        reviews: [
            {
                user: document.getElementById('user1').value,
                rating: parseInt(document.getElementById('rating1').value),
                comment: document.getElementById('comment1').value,
            },
            {
                user: document.getElementById('user2').value,
                rating: parseInt(document.getElementById('rating2').value),
                comment: document.getElementById('comment2').value,
            }
        ],
        relatedProducts: document.getElementById('relatedProducts').value.split(',').map(id => parseInt(id.trim())),
    };

    // Send data to the server
    fetch('/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text(); // Change to response.json() if you return JSON
    })
    .then(data => {
        console.log('Success:', data);
        document.getElementById('product-form').reset(); // Reset the form
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});