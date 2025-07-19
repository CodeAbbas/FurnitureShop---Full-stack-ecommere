// Centralized fetch function
async function fetchProducts() {
        try {
            const response = await fetch('product-admin/products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

// Google Maps initialization
function initMap() {
    const elements = document.querySelectorAll('.js-map');
    Array.prototype.forEach.call(elements, function (el) {
        const lat = +el.dataset.latitude;
        const lng = +el.dataset.longitude;
        const zoom = +el.dataset.zoom;
        if ((lat !== '') && (lng !== '') && (zoom > 0)) {
            var map = new google.maps.Map(el, { zoom: zoom, center: { lat: lat, lng: lng }, disableDefaultUI: true });
            var marker = new google.maps.Marker({ map: map, animation: google.maps.Animation.DROP, position: { lat: lat, lng: lng } });
        }
    });
}

// Product grid view switcher
(function () {
    var container = document.getElementById('products');
    if (container) {
        var grid = container.querySelector('.js-products-grid'),
            viewClass = 'tm-products-',
            optionSwitch = Array.prototype.slice.call(container.querySelectorAll('.js-change-view a'));
        function init() {
            optionSwitch.forEach(function (el, i) {
                el.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    _switch(this);
                }, false);
            });
        }
        function _switch(opt) {
            optionSwitch.forEach(function (el) {
                grid.classList.remove(viewClass + el.getAttribute('data-view'));
            });
            grid.classList.add(viewClass + opt.getAttribute('data-view'));
        }
        init();
    }
})();

// Quantity incrementer
function increment(incrementor, target) {
    var value = parseInt(document.getElementById(target).value, 10);
    value = isNaN(value) ? 0 : value;
    if (incrementor < 0) {
        if (value > 1) { value += incrementor; }
    } else {
        value += incrementor;
    }
    document.getElementById(target).value = value;
}

// UIkit interactions
(function () { UIkit.scroll('.js-scroll-to-description', { duration: 300, offset: 58 }); })();
(function () { UIkit.util.on('.js-product-switcher', 'show', function () { UIkit.update(); }); })();
(function () {
    // This function now attaches the event listener to the document,
    // so it works for dynamically created product cards.
    document.addEventListener('click', function(event) {
        const button = event.target.closest('.js-add-to-cart');
        if (!button) return;

        // Find the product ID from the card's link
        const card = button.closest('.tm-product-card');
        if (card) {
            const link = card.querySelector('a.tm-media-box');
            const urlParams = new URLSearchParams(new URL(link.href).search);
            const productId = urlParams.get('id');
            
            if (productId) {
                addToCart(productId, 1); // Add one item to the cart
                UIkit.offcanvas('#cart-offcanvas').show(); // Show the off-canvas cart
            }
        }
    });
})(); //add to cart button
(function () {
    // Favorites handler
    document.addEventListener('click', function(event) {
        const button = event.target.closest('.js-add-to-favorites');
        if (!button) return;

        const card = button.closest('.tm-product-card');
        if (card) {
            const link = card.querySelector('a.tm-media-box');
            if (link) {
                const urlParams = new URLSearchParams(new URL(link.href).search);
                const productId = urlParams.get('id');
                if (productId) {
                    toggleFavorite(productId);
                }
            }
        }
    });
    // Compare handler
    document.addEventListener('click', function(event) {
        const button = event.target.closest('.js-add-to-compare');
        if (!button) return;
        
        UIkit.notification({ message: "<span uk-icon='icon: check'></span> Added to compare (demo)", pos: 'bottom-right' });
        button.classList.toggle('tm-action-button-active');
    });
})(); //favorites

// Product card creation
function createProductCard(product) {
    if (!product || !product.title) { return ''; }

    const price = product.variations && product.variations.sizes && product.variations.sizes.length > 0
        ? `£${parseFloat(product.variations.sizes[0].price || 0).toFixed(2)}`
        : `£${parseFloat(product.price || 0).toFixed(2)}`;

    let label = '';
    let labelClass = '';
    let labelBg = '';
    if (product.newArrival) {
        label = 'New';
        labelClass = 'uk-label-success';
        labelBg = '#28a745';
    } else if (product.topSelling) {
        label = 'Top';
        labelClass = 'uk-label-warning';
        labelBg = '#ffc107';
    } else if (product.outStock) {
        label = 'Sold Out';
        labelClass = 'uk-label-danger';
        labelBg = '#dc3545';
    }

    const image = product.images && product.images.length > 0
        ? product.images[0]
        : 'https://via.placeholder.com/400x300?text=No+Image';

    // Calculate average rating
    const averageRating = product.reviews && product.reviews.length
        ? (product.reviews.reduce((sum, review) => sum + parseFloat(review.rating || 0), 0) / product.reviews.length).toFixed(1)
        : 'No Rating';

    // Category and subcategory
    const categoryText = `${product.category || ''}${product.subcategory ? ' / ' + product.subcategory : ''}`;

    return `
        <li style="min-width: 0;">
            <article class="tm-product-card uk-card">
                <div class="tm-product-card-media">
                    <div class="tm-ratio tm-ratio-4-3">
                        <a class="tm-media-box" href="product.html?id=${product.id}">
                            <div class="tm-product-card-labels">
                                ${product.topSelling ? '<span class="uk-label uk-label-warning">Top Selling</span>' : ''}
                                ${product.newArrival ? '<span class="uk-label uk-label-success">New Arrival</span>' : ''}
                                ${product.outStock ? '<span class="uk-label uk-label-danger">Out of stock</span>' : ''}
                            </div>
                            <figure class="tm-media-box-wrap">
                                <img src="${image}" alt="${product.title}" style="object-fit: cover; width: 100%; height: 100%; " loading="lazy"/>
                            </figure>
                        </a>
                    </div>
                </div>
                <div class="tm-product-card-body">
                    <div class="tm-product-card-info">
                        <div class="uk-text-meta uk-margin-xsmall-bottom">${categoryText}</div>
                        <h3 class="tm-product-card-title">
                            <a class="uk-link-heading text-bold" href="product.html?id=${product.id}">${product.title}</a>
                        </h3>
                        <ul class="uk-list uk-text-small tm-product-card-properties">
                            <li><span class="uk-text-muted">Rating: </span><span>${averageRating}</span></li>
                        </ul>
                    </div>
                    <div class="tm-product-card-shop">
                        <div class="tm-product-card-prices">
                            ${product.oldPrice ? `<del class="uk-text-meta">£${product.oldPrice}</del>` : ''}
                            <div class="tm-product-card-price">${price}</div>
                        </div>
                        <div class="tm-product-card-add">
                            <div class="uk-text-meta tm-product-card-actions">
                                <a class="tm-product-card-action js-add-to js-add-to-favorites" title="Add to favorites">
                                    <span uk-icon="icon: heart; ratio: .95;"></span>
                                </a>
                            </div>
                            <!-- This button now triggers the event listener we set up -->
                            <button class="uk-button uk-button-primary tm-product-card-add-button tm-shine js-add-to-cart">
                                <span class="tm-product-card-add-button-icon" uk-icon="cart"></span>
                                <span class="tm-product-card-add-button-text">add to cart</span>
                            </button>
                        </div>
                    </div>
                </div>
            </article>
        </li>
    `;
}

// Best Selling card creation
function createBestSellingCard(product) {
    if (!product || !product.title || !product.id) return '';

    const image = product.images?.[0] || 'https://via.placeholder.com/1000x563?text=No+Image';
    const productUrl = `product.html?id=${product.id}`;

    const ratingText = product.reviews?.length
        ? (product.reviews.reduce((sum, review) => sum + parseFloat(review.rating || 0), 0) / product.reviews.length).toFixed(1)
        : 'No Rating';

    const categoryText = `${product.category || ''}${product.subcategory ? ' / ' + product.subcategory : ''}`;

    return `
        <li style="padding: 10px; box-sizing: border-box; border-radius: 5px;">
            <div class="uk-inline-clip uk-transition-toggle uk-height-medium uk-width-1-1" tabindex="0" style="border-radius: 10px; overflow: hidden;">
                <a href="${productUrl}" class="tm-best-selling-media-box">
                    <img src="${image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; object-position: center;">
                    <div class="uk-overlay uk-overlay-primary uk-position-top-left uk-padding-small category-text">
                        ${categoryText}
                    </div>
                    <div class=" uk-position-bottom uk-text-center uk-transition-slide-bottom" style="background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent); padding: 20px;">
                        <h4 class="uk-margin-remove uk-text-bold " style="color: rgb(226, 225, 225);">${product.title}</h4>
                    </div>
                    <div class="tm-best-selling-rating-badge">
                        <span class="uk-icon" uk-icon="icon: star; ratio: 1;"></span>
                        <span>${ratingText}</span>
                    </div>
                </a>
            </div>
        </li>
    `;
}

// Featured Products
document.addEventListener('DOMContentLoaded', async () => {
    const slider = document.getElementById('product-slider');
    const container = document.querySelector('.featured-container');

    try {
        const products = await fetchProducts();
        const featuredProducts = products
            .filter(p => p && (p.newArrival || p.topSelling || (p.inStock && p.inStock > 0)))
            .slice(0, 6); // Reduced to 6 for faster mobile loading

        if (featuredProducts.length === 0) {
            if (slider) {
                slider.innerHTML = '<li class="uk-text-center uk-padding-small">No trending products available</li>';
            }
            if (container) {
                container.innerHTML = '<div class="uk-text-center uk-padding-small">No trending products available</div>';
            }
            return;
        }

        featuredProducts.forEach(product => {
            const cardHtml = createProductCard(product);
            if (cardHtml) {
                if (slider) {
                    slider.innerHTML += cardHtml;
                }
                if (container) {
                    const card = document.createElement('div');
                    card.className = 'uk-width-1-1 uk-width-1-2@s uk-width-1-3@m uk-width-1-4@l';
                    card.innerHTML = cardHtml;
                    container.appendChild(card);
                }
            }
        });

        if (slider) {
            UIkit.slider(slider.parentElement, {
                autoplay: true,
                autoplayInterval: 4000,
                finite: true, // Better UX on mobile
                pauseOnHover: true,
                center: false,
                sets: false // One card per slide
            });
        }
    } catch (error) {
        if (slider) {
            slider.innerHTML = `<li class="uk-text-center uk-padding-small">Error loading products: ${error.message}</li>`;
        }
        if (container) {
            container.innerHTML = `<div class="uk-text-center uk-padding-small">Error loading products: ${error.message}</div>`;
        }
    }
});

// featured products newVersion
function createFeaturedProductCard(product) {
        if (!product || !product.title) { return ''; }

        const price = `£${parseFloat(product.price || 0).toFixed(2)}`;
        const oldPrice = product.oldPrice ? `£${parseFloat(product.oldPrice).toFixed(2)}` : '';
        const image = product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/600x600?text=No+Image';
        const onSale = !!product.oldPrice;

        // Determine the category for the filter tabs
        let category = 'all';
        if (product.newArrival) category = 'new';
        else if (product.topSelling) category = 'best';
        if (onSale) category = 'sale';

        return `
            <div data-category="${category}">
                <article class="tm-product-card uk-card uk-card-default product-card uk-light">
                    <div class="uk-card-media-top uk-inline-clip">
                        <a class="tm-media-box" href="product.html?id=${product.id}">
                            <img src="${image}" alt="${product.title}" loading="lazy">
                        </a>
                        
                        <div class="card-actions uk-transition-fade uk-position-top-right uk-padding-small">
                             <a class="uk-icon-button js-add-to-favorites tm-shine" href="#" uk-icon="heart" title="Add to favorites"></a>
                            <button class="uk-icon-button uk-margin-small-left  tm-shine js-add-to-cart" uk-icon="cart" title="Add to Cart"></button>
                        </div>

                        <div class="card-actions uk-transition-fade uk-position-top-left uk-padding-small w-1/2">
                            ${product.topSelling ? '<span class="uk-label uk-label-warning">Top </span>' : ''}
                                ${product.newArrival ? '<span class="uk-label uk-label-success ">New</span>' : ''}
                                ${product.outStock ? '<span class="uk-label uk-label-danger">Out of stock</span>' : ''}
                        </div>

                        <div class="content-overlay">
                            <h3 class="uk-card-title uk-margin-remove-bottom uk-text-truncate"><a class="uk-link-reset" href="product.html?id=${product.id}">${product.title}</a></h3>
                            <p class="uk-text-meta uk-margin-remove-top">${product.category} / ${product.subcategory}</p>
                            <div class="uk-flex uk-flex-between uk-flex-middle uk-margin-small-top">
                                <div class="product-price">${price} ${oldPrice ? `<span class="product-price-old">${oldPrice}</span>` : ''}</div>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        `;
    }
    document.addEventListener('DOMContentLoaded', async () => {
        // This targets the grid container from our new design.
        const container = document.querySelector('.featured-section .js-filter');

        // If the new container doesn't exist on the page, do nothing.
        if (!container) {
            return;
        }

        try {
            const products = await fetchProducts();
            
            // Using the exact filter and slice logic from your script.
            const featuredProducts = products
                .filter(p => p && (p.newArrival || p.topSelling || (p.inStock && p.inStock > 0)))
                .slice(0, 8); // Showing 8 cards to better fill the grid

            if (featuredProducts.length === 0) {
                container.innerHTML = '<div class="uk-width-1-1 uk-text-center uk-padding-small">No featured products available</div>';
                return;
            }
            
            let productsHtml = '';
            featuredProducts.forEach(product => {
                // The main logic now calls our new function.
                const cardHtml = createFeaturedProductCard(product); 
                if (cardHtml) {
                   productsHtml += cardHtml;
                }
            });

            container.innerHTML = productsHtml;
            
            // Let UIkit re-evaluate the grid after we've added the new content
            if (UIkit.grid) {
                UIkit.grid(container);
            }

        } catch (error) {
            container.innerHTML = `<div class="uk-width-1-1 uk-text-center uk-padding-small">Error loading products: ${error.message}</div>`;
        }
    }); // featured products newVersion 
// Best Selling Slider
document.addEventListener('DOMContentLoaded', async () => {
    const slider = document.getElementById('best-selling-slider');
    if (!slider) return;

    try {
        const products = await fetchProducts();
        const bestSellingProducts = products
            .filter(p => p && (p.topSelling || p.newArrival || (p.inStock && p.inStock > 0)))
            .slice(0, 12);

        if (bestSellingProducts.length === 0) {
            slider.innerHTML = '<li style="padding: 20px; text-align: center; font-size: 1.2rem; color: #333;">No best-selling products available</li>';
            return;
        }

        bestSellingProducts.forEach(product => {
            const cardHtml = createBestSellingCard(product);
            if (cardHtml) slider.innerHTML += cardHtml;
        });

        UIkit.slider(slider.parentElement, { finite: true, sets: true });
    } catch (error) {
        slider.innerHTML = `<li style="padding: 20px; text-align: center; font-size: 1.2rem; color: #333;">Error loading products: ${error.message}</li>`;
    }
});

// Lookbook
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('lookbook-grid');
    if (!grid) return;

    try {
        const products = await fetchProducts();
        const productsByCategory = products.reduce((acc, product) => {
            if (!acc[product.category]) acc[product.category] = product;
            return acc;
        }, {});
        const lookbookItems = Object.values(productsByCategory);

        lookbookItems.forEach(product => {
            const image = product.images?.[0] || 'https://via.placeholder.com/600';
            const title = product.category;
            const link = `category.html?cat=${encodeURIComponent(product.category)}`;

            const item = document.createElement('div');
            item.className = 'lookbook-item';
            item.innerHTML = `
                <a href="${link}" class="uk-inline-clip uk-transition-toggle" tabindex="0">
                    <img src="${image}" alt="${title}" class="uk-width-1-1 uk-height-medium uk-object-cover">
                    <div class="uk-overlay uk-overlay-primary uk-position-cover uk-flex uk-flex-center uk-flex-middle uk-transition-fade">
                        <div class="lookbook-content">
                            <h3 class="uk-text-uppercase uk-margin-remove">${title}</h3>
                            <button class="uk-button uk-button-primary uk-button-small uk-margin-small-top">Shop Now</button>
                        </div>
                    </div>
                </a>
            `;
            grid.appendChild(item);
        });
    } catch (error) {
        console.error('Lookbook load error:', error);
        grid.innerHTML = '<div style="padding: 20px; text-align: center; color: #333;">Error loading lookbook: ' + error.message + '</div>';
    }
});