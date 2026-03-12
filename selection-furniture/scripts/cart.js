// Immediately fetch all product data to have it available for cart operations
let allProducts = [];
fetch('/product-admin/products.json')
    .then(response => response.json())
    .then(data => {
        allProducts = data;
        // Update the cart display in case the page was just loaded
        updateCartDisplay();
    })
    .catch(error => console.error('Error fetching products for cart:', error));

/**
 * Retrieves the cart from localStorage.
 * @returns {Array} The cart, which is an array of item objects.
 */
function getCart() {
    return JSON.parse(localStorage.getItem('selectionFurnitureCart')) || [];
}

/**
 * Saves the cart to localStorage.
 * @param {Array} cart - The cart array to save.
 */
function saveCart(cart) {
    localStorage.setItem('selectionFurnitureCart', JSON.stringify(cart));
    updateCartDisplay(); // Update UI every time the cart is saved
}

/**
 * Adds an item to the shopping cart.
 * @param {string|number} productId - The ID of the product to add.
 * @param {number} [quantity=1] - The quantity of the product to add.
 */
function addToCart(productId, quantity = 1) {
    const product = allProducts.find(p => p.id.toString() === productId.toString());
    if (!product) {
        console.error('Product not found!');
        UIkit.notification({ message: `<span uk-icon='icon: warning'></span> Could not add item to cart. Product not found.`, status: 'danger' });
        return;
    }

    const cart = getCart();
    const existingItem = cart.find(item => item.id.toString() === productId.toString());

    if (existingItem) {
        // If item already exists, just update its quantity
        existingItem.quantity += quantity;
    } else {
        // Otherwise, add the new item to the cart
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.images[0],
            quantity: quantity
        });
    }

    saveCart(cart);
    UIkit.notification({ message: `<span uk-icon='icon: check'></span> Added '${product.title}' to cart.`, status: 'success', pos: 'bottom-right' });
}

/**
 * Removes an item completely from the cart.
 * @param {string|number} productId - The ID of the product to remove.
 */
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id.toString() !== productId.toString());
    saveCart(cart);
}

/**
 * Updates the quantity of a specific item in the cart.
 * @param {string|number} productId - The ID of the product to update.
 * @param {number} quantity - The new quantity.
 */
function updateQuantity(productId, quantity) {
    let cart = getCart();
    const item = cart.find(item => item.id.toString() === productId.toString());

    if (item) {
        if (quantity > 0) {
            item.quantity = quantity;
        } else {
            // If quantity is 0 or less, remove the item
            cart = cart.filter(cartItem => cartItem.id.toString() !== productId.toString());
        }
    }
    saveCart(cart);
}

/**
 * Calculates the total number of items in the cart.
 * @returns {number} The total item count.
 */
function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Calculates the subtotal price of all items in the cart.
 * @returns {number} The subtotal.
 */
function calculateSubtotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Updates the cart icon badge and the off-canvas cart view.
 */
function updateCartDisplay() {
    const itemCount = getCartItemCount();
    const cartBadge = document.querySelector('.tm-navbar-button .uk-badge');
    if (cartBadge) {
        cartBadge.textContent = itemCount;
        cartBadge.style.display = itemCount > 0 ? 'inline-flex' : 'none';
    }

    // Update the off-canvas cart
    const offCanvasCartList = document.querySelector('#cart-offcanvas .uk-list');
    const offCanvasFooter = document.querySelector('#cart-offcanvas .uk-card-footer');
    const cart = getCart();

    if (offCanvasCartList) {
        if (cart.length === 0) {
            offCanvasCartList.innerHTML = '<li><p class="uk-text-center">Your cart is empty.</p></li>';
            offCanvasFooter.style.display = 'none';
        } else {
            offCanvasCartList.innerHTML = cart.map(item => `
                <li class="uk-visible-toggle">
                    <article>
                        <div class="uk-grid-small" uk-grid>
                            <div class="uk-width-1-4">
                                <div class="tm-ratio tm-ratio-4-3">
                                    <a class="tm-media-box" href="product.html?id=${item.id}">
                                        <figure class="tm-media-box-wrap"><img src="${item.image}" alt="${item.title}"></figure>
                                    </a>
                                </div>
                            </div>
                            <div class="uk-width-expand">
                                <a class="uk-link-heading uk-text-small" href="product.html?id=${item.id}">${item.title}</a>
                                <div class="uk-margin-xsmall uk-grid-small uk-flex-middle" uk-grid>
                                    <div class="uk-text-bolder uk-text-small">£${item.price.toFixed(2)}</div>
                                    <div class="uk-text-meta uk-text-xsmall">${item.quantity} × £${item.price.toFixed(2)}</div>
                                </div>
                            </div>
                            <div>
                                <a class="uk-icon-link uk-text-danger uk-invisible-hover" href="#" onclick="removeFromCart('${item.id}'); event.preventDefault();" uk-icon="icon: close; ratio: .75" uk-tooltip="Remove"></a>
                            </div>
                        </div>
                    </article>
                </li>
            `).join('');

            const subtotal = calculateSubtotal();
            const subtotalEl = offCanvasFooter.querySelector('.uk-h4.uk-text-bolder');
            if (subtotalEl) {
                subtotalEl.textContent = `£${subtotal.toFixed(2)}`;
            }
            offCanvasFooter.style.display = 'block';
        }
    }
}

// Initial call to set up the cart display when the script loads
document.addEventListener('DOMContentLoaded', updateCartDisplay);
