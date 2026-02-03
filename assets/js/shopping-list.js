/**
 * CJC Recipe Features - Shopping List Management
 *
 * Handles storing and managing shopping list items in localStorage
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'cjc_shopping_list';

    /**
     * Get the current shopping list from localStorage
     * @returns {Array} Shopping list items
     */
    function getShoppingList() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading shopping list:', e);
            return [];
        }
    }

    /**
     * Save the shopping list to localStorage
     * @param {Array} list - Shopping list items
     */
    function saveShoppingList(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.error('Error saving shopping list:', e);
        }
    }

    /**
     * Add ingredients to the shopping list
     * @param {Array} ingredients - Array of ingredient objects
     * @param {number} recipeId - Recipe post ID
     * @param {string} recipeTitle - Recipe title
     */
    function addToShoppingList(ingredients, recipeId, recipeTitle) {
        const list = getShoppingList();

        ingredients.forEach(ing => {
            list.push({
                id: generateId(),
                item: ing.item || ing.original,
                amount: ing.amount,
                unit: ing.unit,
                notes: ing.notes,
                recipeId: recipeId,
                recipeTitle: recipeTitle,
                checked: false,
                addedAt: new Date().toISOString()
            });
        });

        // Combine duplicates
        const combined = combineIngredients(list);
        saveShoppingList(combined);

        return combined;
    }

    /**
     * Remove an item from the shopping list
     * @param {string} itemId - Item ID to remove
     */
    function removeFromShoppingList(itemId) {
        const list = getShoppingList();
        const filtered = list.filter(item => item.id !== itemId);
        saveShoppingList(filtered);
        return filtered;
    }

    /**
     * Toggle an item's checked state
     * @param {string} itemId - Item ID to toggle
     */
    function toggleItemChecked(itemId) {
        const list = getShoppingList();
        const item = list.find(i => i.id === itemId);
        if (item) {
            item.checked = !item.checked;
            saveShoppingList(list);
        }
        return list;
    }

    /**
     * Clear all checked items
     */
    function clearCheckedItems() {
        const list = getShoppingList();
        const filtered = list.filter(item => !item.checked);
        saveShoppingList(filtered);
        return filtered;
    }

    /**
     * Clear all items
     */
    function clearAllItems() {
        saveShoppingList([]);
        return [];
    }

    /**
     * Clear items from a specific recipe
     * @param {number} recipeId - Recipe post ID
     */
    function clearRecipeItems(recipeId) {
        const list = getShoppingList();
        const filtered = list.filter(item => item.recipeId !== recipeId);
        saveShoppingList(filtered);
        return filtered;
    }

    /**
     * Combine duplicate ingredients
     * @param {Array} list - Shopping list items
     * @returns {Array} Combined list
     */
    function combineIngredients(list) {
        const combined = {};

        list.forEach(item => {
            // Create a key based on item name and unit
            const key = normalizeItem(item.item) + '|' + normalizeUnit(item.unit);

            if (combined[key]) {
                // Combine amounts if both have amounts
                if (item.amount !== null && combined[key].amount !== null) {
                    combined[key].amount += item.amount;
                }
                // Track multiple recipes
                if (!combined[key].recipeIds) {
                    combined[key].recipeIds = [combined[key].recipeId];
                    combined[key].recipeTitles = [combined[key].recipeTitle];
                }
                if (!combined[key].recipeIds.includes(item.recipeId)) {
                    combined[key].recipeIds.push(item.recipeId);
                    combined[key].recipeTitles.push(item.recipeTitle);
                }
            } else {
                combined[key] = { ...item };
            }
        });

        return Object.values(combined);
    }

    /**
     * Normalize item name for comparison
     * @param {string} item - Item name
     * @returns {string} Normalized name
     */
    function normalizeItem(item) {
        if (!item) return '';
        return item.toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/s$/, ''); // Remove trailing 's' for plurals
    }

    /**
     * Normalize unit for comparison
     * @param {string} unit - Unit name
     * @returns {string} Normalized unit
     */
    function normalizeUnit(unit) {
        if (!unit) return '';

        unit = unit.toLowerCase().trim();

        const normalizations = {
            'tbsp': 'tablespoon',
            'tablespoons': 'tablespoon',
            'tsp': 'teaspoon',
            'teaspoons': 'teaspoon',
            'oz': 'ounce',
            'ounces': 'ounce',
            'lb': 'pound',
            'lbs': 'pound',
            'pounds': 'pound',
            'cups': 'cup',
            'g': 'gram',
            'grams': 'gram',
            'kg': 'kilogram',
            'kilograms': 'kilogram',
            'ml': 'milliliter',
            'milliliters': 'milliliter',
            'l': 'liter',
            'liters': 'liter',
            'cloves': 'clove',
            'slices': 'slice',
            'pieces': 'piece',
            'cans': 'can',
            'packages': 'package',
            'pkg': 'package'
        };

        return normalizations[unit] || unit;
    }

    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    function generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Format an item for display
     * @param {Object} item - Shopping list item
     * @returns {string} Formatted display string
     */
    function formatItemDisplay(item) {
        let display = '';

        if (item.amount !== null && item.amount !== undefined) {
            display += window.CJCScaling ? window.CJCScaling.formatAmount(item.amount) : item.amount;
        }

        if (item.unit) {
            if (display) display += ' ';
            display += item.unit;
        }

        if (item.item) {
            if (display) display += ' ';
            display += item.item;
        }

        return display;
    }

    /**
     * Get items grouped by recipe
     * @returns {Object} Items grouped by recipe ID
     */
    function getItemsByRecipe() {
        const list = getShoppingList();
        const grouped = {};

        list.forEach(item => {
            const recipeId = item.recipeId || 'other';
            if (!grouped[recipeId]) {
                grouped[recipeId] = {
                    recipeTitle: item.recipeTitle || 'Other Items',
                    items: []
                };
            }
            grouped[recipeId].items.push(item);
        });

        return grouped;
    }

    /**
     * Get count of items in shopping list
     * @returns {number} Item count
     */
    function getItemCount() {
        return getShoppingList().length;
    }

    /**
     * Check if a recipe's ingredients are in the shopping list
     * @param {number} recipeId - Recipe post ID
     * @returns {boolean} True if recipe has items in list
     */
    function hasRecipeInList(recipeId) {
        const list = getShoppingList();
        return list.some(item => item.recipeId === recipeId);
    }

    // Export to global namespace
    window.CJCShoppingList = {
        getShoppingList: getShoppingList,
        addToShoppingList: addToShoppingList,
        removeFromShoppingList: removeFromShoppingList,
        toggleItemChecked: toggleItemChecked,
        clearCheckedItems: clearCheckedItems,
        clearAllItems: clearAllItems,
        clearRecipeItems: clearRecipeItems,
        combineIngredients: combineIngredients,
        formatItemDisplay: formatItemDisplay,
        getItemsByRecipe: getItemsByRecipe,
        getItemCount: getItemCount,
        hasRecipeInList: hasRecipeInList
    };
})();
