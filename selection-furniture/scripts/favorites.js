/**
 * Retrieves the favorites list from localStorage.
 * @returns {Array} An array of product IDs.
 */
function getFavorites() {
    return JSON.parse(localStorage.getItem('selectionFurnitureFavorites')) || [];
}

/**
 * Saves the favorites list to localStorage.
 * @param {Array} favorites - The array of product IDs to save.
 */
function saveFavorites(favorites) {
    localStorage.setItem('selectionFurnitureFavorites', JSON.stringify(favorites));
    updateFavoriteIcons();
}

/**
 * Checks if a product is in the user's favorites.
 * @param {string|number} productId - The ID of the product to check.
 * @returns {boolean} True if the product is a favorite, false otherwise.
 */
function isFavorite(productId) {
    const favorites = getFavorites();
    return favorites.includes(productId.toString());
}

/**
 * Toggles a product's status in the favorites list.
 * Adds it if it's not there, removes it if it is.
 * @param {string|number} productId - The ID of the product to toggle.
 */
function toggleFavorite(productId) {
    let favorites = getFavorites();
    const productIdStr = productId.toString();
    const favoriteIndex = favorites.indexOf(productIdStr);

    if (favoriteIndex > -1) {
        // Item is already a favorite, so remove it
        favorites.splice(favoriteIndex, 1);
        UIkit.notification({ message: `<span uk-icon='icon: heart'></span> Removed from favorites.`, status: 'warning', pos: 'bottom-right' });
    } else {
        // Item is not a favorite, so add it
        favorites.push(productIdStr);
        UIkit.notification({ message: ` <span uk-icon='icon: heart'></span>  Added to favorites!`, status: 'success', pos: 'bottom-right' });
    }

    saveFavorites(favorites);
}

/**
 * Updates the visual state of all favorite icons on the page.
 */
function updateFavoriteIcons() {
    const favoriteButtons = document.querySelectorAll('.js-add-to-favorites');
    favoriteButtons.forEach(button => {
        const card = button.closest('.tm-product-card');
        if (card) {
            const link = card.querySelector('a.tm-media-box');
            if(link) {
                const urlParams = new URLSearchParams(new URL(link.href).search);
                const productId = urlParams.get('id');
                if (productId && isFavorite(productId)) {
                    button.classList.add('tm-action-button-active');
                } else {
                    button.classList.remove('tm-action-button-active');
                }
            }
        }
    });
}

// Update icons when the page loads
document.addEventListener('DOMContentLoaded', updateFavoriteIcons);
