/**
 * CJC Recipe Features - Main JavaScript
 *
 * Handles print, save, scale, and shopping list functionality
 */

(function() {
    'use strict';

    // Storage keys
    const SAVED_RECIPES_KEY = 'cjc_saved_recipes';
    const SCALE_PREFIX = 'cjc_recipe_scale_';

    // State
    let currentPostId = null;
    let currentPostTitle = null;
    let currentPostSlug = null;
    let currentPostImage = null;
    let isRecipe = false;

    /**
     * Initialize the recipe features
     */
    function init() {
        // Get data from localized script
        if (typeof cjcRecipeData !== 'undefined') {
            currentPostId = cjcRecipeData.postId;
            currentPostTitle = cjcRecipeData.postTitle;
            currentPostSlug = cjcRecipeData.postSlug;
            currentPostImage = cjcRecipeData.postImage;
            isRecipe = cjcRecipeData.isRecipe;
        }

        // Initialize features based on page type
        if (isRecipe) {
            initRecipeFeatures();
        }

        // Initialize page-specific features
        initPageFeatures();
    }

    /**
     * Initialize recipe post features
     */
    function initRecipeFeatures() {
        // Load saved state
        updateSaveButtonState();
        loadScalePreference();

        // Attach event listeners
        attachRecipeEventListeners();
        attachFloatingButtonListeners();
    }

    /**
     * Attach event listeners for recipe action buttons
     */
    function attachRecipeEventListeners() {
        // Print button
        document.querySelectorAll('.cjc-btn--print').forEach(btn => {
            btn.addEventListener('click', handlePrint);
        });

        // Save button
        document.querySelectorAll('.cjc-btn--save').forEach(btn => {
            btn.addEventListener('click', handleSave);
        });

        // Shopping list button
        document.querySelectorAll('.cjc-btn--shopping').forEach(btn => {
            btn.addEventListener('click', handleAddToShoppingList);
        });

        // Servings selector
        const servingsSelect = document.getElementById('cjc-servings-select');
        if (servingsSelect) {
            servingsSelect.addEventListener('change', handleScaleChange);
        }
    }

    /**
     * Attach event listeners for floating action button
     */
    function attachFloatingButtonListeners() {
        const fab = document.querySelector('.cjc-floating-btn');
        if (!fab) return;

        // Main FAB toggle
        const mainBtn = fab.querySelector('.cjc-fab--main');
        if (mainBtn) {
            mainBtn.addEventListener('click', () => {
                fab.classList.toggle('is-open');
            });
        }

        // FAB menu buttons
        const printBtn = fab.querySelector('.cjc-fab--print');
        if (printBtn) {
            printBtn.addEventListener('click', handlePrint);
        }

        const saveBtn = fab.querySelector('.cjc-fab--save');
        if (saveBtn) {
            saveBtn.addEventListener('click', handleSave);
        }

        const shoppingBtn = fab.querySelector('.cjc-fab--shopping');
        if (shoppingBtn) {
            shoppingBtn.addEventListener('click', handleAddToShoppingList);
        }

        // Show FAB on scroll
        let lastScroll = 0;
        const actionsBar = document.querySelector('.cjc-recipe-actions');

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (actionsBar) {
                const actionsRect = actionsBar.getBoundingClientRect();
                // Show FAB when actions bar is scrolled out of view
                if (actionsRect.bottom < 0) {
                    fab.style.display = 'block';
                } else {
                    fab.style.display = 'none';
                    fab.classList.remove('is-open');
                }
            }

            lastScroll = currentScroll;
        });

        // Close FAB menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!fab.contains(e.target)) {
                fab.classList.remove('is-open');
            }
        });
    }

    /**
     * Handle print button click
     */
    function handlePrint() {
        window.print();
    }

    /**
     * Handle save button click
     */
    function handleSave() {
        const saved = getSavedRecipes();
        const index = saved.findIndex(r => r.id === currentPostId);

        if (index !== -1) {
            // Remove from saved
            saved.splice(index, 1);
            showToast('Recipe removed from saved');
        } else {
            // Add to saved
            saved.push({
                id: currentPostId,
                title: currentPostTitle,
                slug: currentPostSlug,
                image: currentPostImage,
                savedAt: new Date().toISOString()
            });
            showToast('Recipe saved!', 'success');
        }

        saveSavedRecipes(saved);
        updateSaveButtonState();
    }

    /**
     * Handle scale change
     */
    function handleScaleChange(e) {
        const multiplier = parseFloat(e.target.value);

        // Update all ingredient items
        document.querySelectorAll('.cjc-ingredient-item').forEach(item => {
            if (multiplier === 1) {
                window.CJCScaling.resetIngredient(item);
            } else {
                window.CJCScaling.updateIngredientDisplay(item, multiplier);
            }
        });

        // Update scale indicator
        const indicator = document.querySelector('.cjc-scale-indicator');
        if (indicator) {
            if (multiplier === 1) {
                indicator.style.display = 'none';
            } else {
                indicator.textContent = `Scaled to ${multiplier}×`;
                indicator.style.display = 'inline';
            }
        }

        // Save preference
        saveScalePreference(multiplier);
    }

    /**
     * Handle add to shopping list
     */
    function handleAddToShoppingList() {
        // Get all ingredient items
        const ingredientElements = document.querySelectorAll('.cjc-ingredient-item');
        const ingredients = [];

        ingredientElements.forEach(el => {
            const original = el.getAttribute('data-original');
            if (original && window.CJCScaling) {
                const parsed = window.CJCScaling.parseIngredient(original);
                ingredients.push(parsed);
            }
        });

        if (ingredients.length === 0) {
            showToast('No ingredients found', 'error');
            return;
        }

        // Check current scale and apply to ingredients
        const servingsSelect = document.getElementById('cjc-servings-select');
        const multiplier = servingsSelect ? parseFloat(servingsSelect.value) : 1;

        if (multiplier !== 1) {
            ingredients.forEach(ing => {
                if (ing.amount !== null) {
                    ing.amount = window.CJCScaling.scaleAmount(ing.amount, multiplier);
                }
            });
        }

        // Add to shopping list
        window.CJCShoppingList.addToShoppingList(ingredients, currentPostId, currentPostTitle);

        showToast(`${ingredients.length} ingredients added to shopping list`, 'success');
    }

    /**
     * Get saved recipes from localStorage
     */
    function getSavedRecipes() {
        try {
            const data = localStorage.getItem(SAVED_RECIPES_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading saved recipes:', e);
            return [];
        }
    }

    /**
     * Save recipes to localStorage
     */
    function saveSavedRecipes(recipes) {
        try {
            localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(recipes));
        } catch (e) {
            console.error('Error saving recipes:', e);
        }
    }

    /**
     * Update save button state based on saved recipes
     */
    function updateSaveButtonState() {
        const saved = getSavedRecipes();
        const isSaved = saved.some(r => r.id === currentPostId);

        // Update action bar button
        document.querySelectorAll('.cjc-btn--save').forEach(btn => {
            btn.classList.toggle('is-saved', isSaved);
            btn.querySelector('span').textContent = isSaved ? 'Saved' : 'Save';
        });

        // Update FAB button
        document.querySelectorAll('.cjc-fab--save').forEach(btn => {
            btn.classList.toggle('is-saved', isSaved);
        });
    }

    /**
     * Load scale preference for current recipe
     */
    function loadScalePreference() {
        try {
            const key = SCALE_PREFIX + currentPostId;
            const saved = localStorage.getItem(key);

            if (saved) {
                const multiplier = parseFloat(saved);
                const select = document.getElementById('cjc-servings-select');

                if (select) {
                    select.value = multiplier;
                    // Trigger change event to apply scaling
                    select.dispatchEvent(new Event('change'));
                }
            }
        } catch (e) {
            console.error('Error loading scale preference:', e);
        }
    }

    /**
     * Save scale preference for current recipe
     */
    function saveScalePreference(multiplier) {
        try {
            const key = SCALE_PREFIX + currentPostId;
            localStorage.setItem(key, multiplier.toString());
        } catch (e) {
            console.error('Error saving scale preference:', e);
        }
    }

    /**
     * Show a toast notification
     */
    function showToast(message, type = 'default') {
        const container = document.getElementById('cjc-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `cjc-toast cjc-toast--${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('is-hiding');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Initialize page-specific features (saved recipes, shopping list pages)
     */
    function initPageFeatures() {
        // Check if we're on the saved recipes page
        if (window.location.pathname.includes('/saved-recipes')) {
            initSavedRecipesPage();
        }

        // Check if we're on the shopping list page
        if (window.location.pathname.includes('/shopping-list')) {
            initShoppingListPage();
        }
    }

    /**
     * Initialize saved recipes page
     */
    function initSavedRecipesPage() {
        const saved = getSavedRecipes();
        const container = document.getElementById('cjc-saved-recipes-container');

        if (!container) return;

        if (saved.length === 0) {
            renderEmptyState(container, 'saved');
            return;
        }

        // Fetch recipe data via AJAX for updated info
        fetchRecipeData(saved.map(r => r.id)).then(recipes => {
            renderRecipeGrid(container, recipes.length ? recipes : saved);
        }).catch(() => {
            // Fall back to local data
            renderRecipeGrid(container, saved);
        });

        // Clear all button
        const clearBtn = document.getElementById('cjc-clear-saved');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to remove all saved recipes?')) {
                    saveSavedRecipes([]);
                    renderEmptyState(container, 'saved');
                    showToast('All saved recipes removed');
                }
            });
        }
    }

    /**
     * Fetch recipe data from server
     */
    function fetchRecipeData(postIds) {
        return new Promise((resolve, reject) => {
            if (typeof cjcRecipeData === 'undefined' || !cjcRecipeData.ajaxUrl) {
                reject(new Error('AJAX URL not available'));
                return;
            }

            const formData = new FormData();
            formData.append('action', 'cjc_get_recipe_data');
            postIds.forEach(id => formData.append('post_ids[]', id));

            fetch(cjcRecipeData.ajaxUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data.data);
                } else {
                    reject(new Error('AJAX request failed'));
                }
            })
            .catch(reject);
        });
    }

    /**
     * Render recipe grid
     */
    function renderRecipeGrid(container, recipes) {
        const grid = document.createElement('div');
        grid.className = 'cjc-recipe-grid';

        recipes.forEach(recipe => {
            const card = createRecipeCard(recipe);
            grid.appendChild(card);
        });

        container.innerHTML = '';
        container.appendChild(grid);
    }

    /**
     * Create a recipe card element
     */
    function createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'cjc-recipe-card';
        card.dataset.recipeId = recipe.id;

        const imageHtml = recipe.image
            ? `<img src="${recipe.image}" alt="${recipe.title}">`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;

        const url = recipe.url || `/${recipe.slug}/`;

        card.innerHTML = `
            <div class="cjc-recipe-card__image ${!recipe.image ? 'cjc-recipe-card__image--placeholder' : ''}">
                ${imageHtml}
            </div>
            <div class="cjc-recipe-card__content">
                <h3 class="cjc-recipe-card__title">
                    <a href="${url}">${recipe.title}</a>
                </h3>
                ${recipe.excerpt ? `<p class="cjc-recipe-card__excerpt">${recipe.excerpt}</p>` : ''}
                <div class="cjc-recipe-card__actions">
                    <button type="button" class="cjc-recipe-card__remove" data-recipe-id="${recipe.id}">Remove</button>
                </div>
            </div>
        `;

        // Remove button handler
        const removeBtn = card.querySelector('.cjc-recipe-card__remove');
        removeBtn.addEventListener('click', () => {
            const saved = getSavedRecipes();
            const filtered = saved.filter(r => r.id !== recipe.id);
            saveSavedRecipes(filtered);
            card.remove();
            showToast('Recipe removed');

            // Check if grid is empty
            const grid = document.querySelector('.cjc-recipe-grid');
            if (grid && grid.children.length === 0) {
                const container = document.getElementById('cjc-saved-recipes-container');
                renderEmptyState(container, 'saved');
            }
        });

        return card;
    }

    /**
     * Render empty state
     */
    function renderEmptyState(container, type) {
        const icon = type === 'saved'
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`;

        const title = type === 'saved' ? 'No Saved Recipes' : 'Shopping List Empty';
        const message = type === 'saved'
            ? 'Save your favorite recipes by clicking the heart icon on any recipe page.'
            : 'Add ingredients from recipes to build your shopping list.';
        const linkText = 'Browse Recipes';
        const linkUrl = '/recipes/';

        container.innerHTML = `
            <div class="cjc-empty-state">
                ${icon}
                <h2>${title}</h2>
                <p>${message}</p>
                <a href="${linkUrl}">${linkText}</a>
            </div>
        `;
    }

    /**
     * Initialize shopping list page
     */
    function initShoppingListPage() {
        const container = document.getElementById('cjc-shopping-list-container');
        if (!container) return;

        renderShoppingList(container);

        // Clear checked button
        const clearCheckedBtn = document.getElementById('cjc-clear-checked');
        if (clearCheckedBtn) {
            clearCheckedBtn.addEventListener('click', () => {
                window.CJCShoppingList.clearCheckedItems();
                renderShoppingList(container);
                showToast('Checked items cleared');
            });
        }

        // Clear all button
        const clearAllBtn = document.getElementById('cjc-clear-all');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the entire shopping list?')) {
                    window.CJCShoppingList.clearAllItems();
                    renderShoppingList(container);
                    showToast('Shopping list cleared');
                }
            });
        }

        // Print button
        const printBtn = document.getElementById('cjc-print-list');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }

    /**
     * Render shopping list
     */
    function renderShoppingList(container) {
        const groupedItems = window.CJCShoppingList.getItemsByRecipe();
        const recipeIds = Object.keys(groupedItems);

        if (recipeIds.length === 0) {
            renderEmptyState(container, 'shopping');
            return;
        }

        const list = document.createElement('div');
        list.className = 'cjc-shopping-list';

        recipeIds.forEach(recipeId => {
            const group = groupedItems[recipeId];
            const section = createShoppingSection(group, recipeId);
            list.appendChild(section);
        });

        container.innerHTML = '';
        container.appendChild(list);
    }

    /**
     * Create a shopping list section
     */
    function createShoppingSection(group, recipeId) {
        const section = document.createElement('div');
        section.className = 'cjc-shopping-list__section';
        section.dataset.recipeId = recipeId;

        const header = document.createElement('div');
        header.className = 'cjc-shopping-list__header';
        header.innerHTML = `
            <h3>${group.recipeTitle}</h3>
            <span class="cjc-shopping-list__count">${group.items.length} items</span>
        `;

        const itemsList = document.createElement('ul');
        itemsList.className = 'cjc-shopping-list__items';

        group.items.forEach(item => {
            const li = createShoppingItem(item);
            itemsList.appendChild(li);
        });

        section.appendChild(header);
        section.appendChild(itemsList);

        return section;
    }

    /**
     * Create a shopping list item
     */
    function createShoppingItem(item) {
        const li = document.createElement('li');
        li.className = 'cjc-shopping-list__item' + (item.checked ? ' is-checked' : '');
        li.dataset.itemId = item.id;

        const displayText = window.CJCShoppingList.formatItemDisplay(item);

        li.innerHTML = `
            <input type="checkbox" class="cjc-shopping-list__checkbox" ${item.checked ? 'checked' : ''}>
            <span class="cjc-shopping-list__text">${displayText}</span>
            <button type="button" class="cjc-shopping-list__remove" title="Remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        // Checkbox handler
        const checkbox = li.querySelector('.cjc-shopping-list__checkbox');
        checkbox.addEventListener('change', () => {
            window.CJCShoppingList.toggleItemChecked(item.id);
            li.classList.toggle('is-checked');
        });

        // Remove button handler
        const removeBtn = li.querySelector('.cjc-shopping-list__remove');
        removeBtn.addEventListener('click', () => {
            window.CJCShoppingList.removeFromShoppingList(item.id);
            li.remove();

            // Check if section is empty
            const section = li.closest('.cjc-shopping-list__section');
            if (section) {
                const remaining = section.querySelectorAll('.cjc-shopping-list__item');
                if (remaining.length === 0) {
                    section.remove();
                } else {
                    // Update count
                    const count = section.querySelector('.cjc-shopping-list__count');
                    if (count) {
                        count.textContent = `${remaining.length} items`;
                    }
                }
            }

            // Check if list is empty
            const container = document.getElementById('cjc-shopping-list-container');
            if (container && container.querySelectorAll('.cjc-shopping-list__item').length === 0) {
                renderEmptyState(container, 'shopping');
            }
        });

        return li;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for external use
    window.CJCRecipeFeatures = {
        showToast: showToast,
        getSavedRecipes: getSavedRecipes
    };
})();
