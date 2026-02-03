/**
 * CJC Recipe Features - Full Version
 */
(function() {
    'use strict';

    var SAVED_KEY = 'cjc_saved_recipes';
    var SHOPPING_KEY = 'cjc_shopping_list';
    var SCALE_PREFIX = 'cjc_recipe_scale_';

    // ==================== INIT ====================
    function init() {
        if (typeof cjcRecipeData !== 'undefined' && cjcRecipeData.isRecipe) {
            initRecipePage();
        }

        if (window.location.pathname.indexOf('/saved-recipes') !== -1) {
            initSavedRecipesPage();
        }

        if (window.location.pathname.indexOf('/shopping-list') !== -1) {
            initShoppingListPage();
        }
    }

    // ==================== RECIPE PAGE ====================
    function initRecipePage() {
        // Save button
        var saveBtn = document.getElementById('cjc-save-btn');
        if (saveBtn) {
            updateSaveButton(saveBtn);
            saveBtn.addEventListener('click', function() {
                toggleSave();
                updateSaveButton(saveBtn);
            });
        }

        // Shopping list button
        var shoppingBtn = document.getElementById('cjc-shopping-btn');
        if (shoppingBtn) {
            shoppingBtn.addEventListener('click', addToShoppingList);
        }

        // Scaling
        var scaleSelect = document.getElementById('cjc-servings-select');
        if (scaleSelect) {
            loadScalePreference(scaleSelect);
            scaleSelect.addEventListener('change', function() {
                applyScaling(parseFloat(this.value));
                saveScalePreference(this.value);
            });
        }

        // Mark ingredient list items for scaling
        markIngredientItems();
    }

    // ==================== SAVE FUNCTIONALITY ====================
    function getSaved() {
        try {
            var data = localStorage.getItem(SAVED_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function setSaved(list) {
        try {
            localStorage.setItem(SAVED_KEY, JSON.stringify(list));
        } catch (e) {}
    }

    function isSaved() {
        if (typeof cjcRecipeData === 'undefined') return false;
        var saved = getSaved();
        for (var i = 0; i < saved.length; i++) {
            if (saved[i].id === cjcRecipeData.postId) return true;
        }
        return false;
    }

    function toggleSave() {
        if (typeof cjcRecipeData === 'undefined') return;

        var saved = getSaved();
        var index = -1;
        for (var i = 0; i < saved.length; i++) {
            if (saved[i].id === cjcRecipeData.postId) {
                index = i;
                break;
            }
        }

        if (index !== -1) {
            saved.splice(index, 1);
            showToast('Recipe removed');
        } else {
            saved.push({
                id: cjcRecipeData.postId,
                title: cjcRecipeData.postTitle,
                slug: cjcRecipeData.postSlug,
                image: cjcRecipeData.postImage
            });
            showToast('Recipe saved!');
        }
        setSaved(saved);
    }

    function updateSaveButton(btn) {
        var span = btn.querySelector('span');
        var icon = btn.querySelector('.cjc-heart-icon');
        if (isSaved()) {
            btn.classList.add('is-saved');
            if (span) span.textContent = 'Saved';
            if (icon) icon.style.fill = 'currentColor';
        } else {
            btn.classList.remove('is-saved');
            if (span) span.textContent = 'Save';
            if (icon) icon.style.fill = 'none';
        }
    }

    // ==================== SHOPPING LIST ====================
    function getShoppingList() {
        try {
            var data = localStorage.getItem(SHOPPING_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function setShoppingList(list) {
        try {
            localStorage.setItem(SHOPPING_KEY, JSON.stringify(list));
        } catch (e) {}
    }

    function addToShoppingList() {
        var ingredients = getIngredientTexts();
        if (ingredients.length === 0) {
            showToast('No ingredients found');
            return;
        }

        var list = getShoppingList();
        var recipeId = cjcRecipeData.postId;
        var recipeTitle = cjcRecipeData.postTitle;

        ingredients.forEach(function(text) {
            list.push({
                id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                text: text,
                recipeId: recipeId,
                recipeTitle: recipeTitle,
                checked: false
            });
        });

        setShoppingList(list);
        showToast(ingredients.length + ' ingredients added');
    }

    function getIngredientTexts() {
        var texts = [];
        var items = document.querySelectorAll('.cjc-ingredient-item');
        items.forEach(function(item) {
            var text = item.getAttribute('data-original') || item.textContent;
            if (text && text.trim()) {
                texts.push(text.trim());
            }
        });
        return texts;
    }

    // ==================== SCALING ====================
    function markIngredientItems() {
        // Find ingredient lists by looking for headings
        var content = document.querySelector('.entry-content') || document.querySelector('article');
        if (!content) return;

        var inIngredients = false;
        var elements = content.querySelectorAll('h2, h3, h4, strong, ul, ol');

        elements.forEach(function(el) {
            var tagName = el.tagName.toLowerCase();
            var text = el.textContent.toLowerCase();

            if (tagName.match(/^h[2-4]$/) || tagName === 'strong') {
                if (text.indexOf('ingredient') !== -1) {
                    inIngredients = true;
                } else if (text.indexOf('instruction') !== -1 || text.indexOf('direction') !== -1) {
                    inIngredients = false;
                }
            }

            if (inIngredients && (tagName === 'ul' || tagName === 'ol')) {
                el.classList.add('cjc-ingredients-list');
                var items = el.querySelectorAll('li');
                items.forEach(function(li) {
                    li.classList.add('cjc-ingredient-item');
                    if (!li.getAttribute('data-original')) {
                        li.setAttribute('data-original', li.textContent);
                    }
                });
                inIngredients = false; // Only mark first list after heading
            }
        });
    }

    function applyScaling(multiplier) {
        var items = document.querySelectorAll('.cjc-ingredient-item');
        var indicator = document.querySelector('.cjc-scale-indicator');

        items.forEach(function(item) {
            var original = item.getAttribute('data-original');
            if (!original) return;

            if (multiplier === 1) {
                item.textContent = original;
                item.classList.remove('is-scaled');
            } else {
                item.innerHTML = scaleIngredientText(original, multiplier);
                item.classList.add('is-scaled');
            }
        });

        if (indicator) {
            if (multiplier === 1) {
                indicator.style.display = 'none';
            } else {
                indicator.textContent = 'Scaled to ' + multiplier + 'x';
                indicator.style.display = 'inline';
            }
        }
    }

    function scaleIngredientText(text, multiplier) {
        // Pattern to find amounts at the beginning
        var pattern = /^([\d\s\/½⅓⅔¼¾⅛⅜⅝⅞]+)\s*/;
        var match = text.match(pattern);

        if (!match) return text;

        var amountStr = match[1].trim();
        var rest = text.substring(match[0].length);
        var amount = parseAmount(amountStr);

        if (amount === null) return text;

        var scaled = amount * multiplier;
        var formatted = formatAmount(scaled);

        return '<span class="cjc-ingredient-amount">' + formatted + '</span> ' + rest;
    }

    function parseAmount(str) {
        // Unicode fractions
        var fractions = {
            '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
            '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
        };

        // Check for unicode fractions
        for (var frac in fractions) {
            if (str.indexOf(frac) !== -1) {
                var parts = str.split(frac);
                var whole = parts[0] ? parseInt(parts[0]) || 0 : 0;
                return whole + fractions[frac];
            }
        }

        // Mixed fraction: "1 1/2"
        var mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
        if (mixedMatch) {
            return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
        }

        // Simple fraction: "1/2"
        var fracMatch = str.match(/^(\d+)\/(\d+)$/);
        if (fracMatch) {
            return parseInt(fracMatch[1]) / parseInt(fracMatch[2]);
        }

        // Decimal or whole number
        var num = parseFloat(str);
        return isNaN(num) ? null : num;
    }

    function formatAmount(num) {
        if (num === null) return '';

        var whole = Math.floor(num);
        var decimal = num - whole;

        var fractionMap = {
            0.125: '⅛', 0.25: '¼', 0.333: '⅓', 0.375: '⅜',
            0.5: '½', 0.625: '⅝', 0.667: '⅔', 0.75: '¾', 0.875: '⅞'
        };

        // Find closest fraction
        var closestFrac = 0;
        var minDiff = 1;
        for (var f in fractionMap) {
            var diff = Math.abs(decimal - parseFloat(f));
            if (diff < minDiff) {
                minDiff = diff;
                closestFrac = parseFloat(f);
            }
        }

        // Round to whole if close
        if (decimal > 0.9) {
            whole++;
            closestFrac = 0;
        } else if (decimal < 0.1) {
            closestFrac = 0;
        }

        var result = '';
        if (whole > 0) result += whole;
        if (closestFrac > 0 && fractionMap[closestFrac]) {
            if (result) result += ' ';
            result += fractionMap[closestFrac];
        }

        return result || num.toFixed(2);
    }

    function loadScalePreference(select) {
        if (typeof cjcRecipeData === 'undefined') return;
        try {
            var saved = localStorage.getItem(SCALE_PREFIX + cjcRecipeData.postId);
            if (saved) {
                select.value = saved;
                applyScaling(parseFloat(saved));
            }
        } catch (e) {}
    }

    function saveScalePreference(value) {
        if (typeof cjcRecipeData === 'undefined') return;
        try {
            localStorage.setItem(SCALE_PREFIX + cjcRecipeData.postId, value);
        } catch (e) {}
    }

    // ==================== SAVED RECIPES PAGE ====================
    function initSavedRecipesPage() {
        var container = document.getElementById('cjc-saved-recipes-container');
        if (!container) return;

        renderSavedRecipes(container);

        var clearBtn = document.getElementById('cjc-clear-saved');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (confirm('Remove all saved recipes?')) {
                    setSaved([]);
                    renderSavedRecipes(container);
                }
            });
        }
    }

    function renderSavedRecipes(container) {
        var saved = getSaved();

        if (saved.length === 0) {
            container.innerHTML = '<div class="cjc-empty-state"><h2>No Saved Recipes</h2><p>Save recipes by clicking the heart icon on any recipe page.</p><a href="/recipes/">Browse Recipes</a></div>';
            return;
        }

        var html = '<div class="cjc-recipe-grid">';
        saved.forEach(function(recipe) {
            var imgHtml = recipe.image
                ? '<img src="' + recipe.image + '" alt="' + recipe.title + '">'
                : '<div class="cjc-recipe-card__image--placeholder">No Image</div>';

            html += '<div class="cjc-recipe-card" data-id="' + recipe.id + '">' +
                '<div class="cjc-recipe-card__image">' + imgHtml + '</div>' +
                '<div class="cjc-recipe-card__content">' +
                '<h3 class="cjc-recipe-card__title"><a href="/' + recipe.slug + '/">' + recipe.title + '</a></h3>' +
                '<button class="cjc-recipe-card__remove" data-id="' + recipe.id + '">Remove</button>' +
                '</div></div>';
        });
        html += '</div>';

        container.innerHTML = html;

        // Add remove handlers
        container.querySelectorAll('.cjc-recipe-card__remove').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = parseInt(this.getAttribute('data-id'));
                var saved = getSaved();
                saved = saved.filter(function(r) { return r.id !== id; });
                setSaved(saved);
                renderSavedRecipes(container);
            });
        });
    }

    // ==================== SHOPPING LIST PAGE ====================
    function initShoppingListPage() {
        var container = document.getElementById('cjc-shopping-list-container');
        if (!container) return;

        renderShoppingList(container);

        var clearChecked = document.getElementById('cjc-clear-checked');
        if (clearChecked) {
            clearChecked.addEventListener('click', function() {
                var list = getShoppingList().filter(function(item) { return !item.checked; });
                setShoppingList(list);
                renderShoppingList(container);
            });
        }

        var clearAll = document.getElementById('cjc-clear-all');
        if (clearAll) {
            clearAll.addEventListener('click', function() {
                if (confirm('Clear entire shopping list?')) {
                    setShoppingList([]);
                    renderShoppingList(container);
                }
            });
        }
    }

    function renderShoppingList(container) {
        var list = getShoppingList();

        if (list.length === 0) {
            container.innerHTML = '<div class="cjc-empty-state"><h2>Shopping List Empty</h2><p>Add ingredients from recipes to build your list.</p><a href="/recipes/">Browse Recipes</a></div>';
            return;
        }

        // Group by recipe
        var grouped = {};
        list.forEach(function(item) {
            var key = item.recipeId || 'other';
            if (!grouped[key]) {
                grouped[key] = { title: item.recipeTitle || 'Other', items: [] };
            }
            grouped[key].items.push(item);
        });

        var html = '<div class="cjc-shopping-list">';
        for (var key in grouped) {
            var group = grouped[key];
            html += '<div class="cjc-shopping-list__section">' +
                '<div class="cjc-shopping-list__header"><h3>' + group.title + '</h3></div>' +
                '<ul class="cjc-shopping-list__items">';

            group.items.forEach(function(item) {
                var checkedClass = item.checked ? ' is-checked' : '';
                var checkedAttr = item.checked ? ' checked' : '';
                html += '<li class="cjc-shopping-list__item' + checkedClass + '" data-id="' + item.id + '">' +
                    '<input type="checkbox" class="cjc-shopping-list__checkbox"' + checkedAttr + '>' +
                    '<span class="cjc-shopping-list__text">' + item.text + '</span>' +
                    '<button class="cjc-shopping-list__remove">&times;</button>' +
                    '</li>';
            });

            html += '</ul></div>';
        }
        html += '</div>';

        container.innerHTML = html;

        // Add handlers
        container.querySelectorAll('.cjc-shopping-list__checkbox').forEach(function(cb) {
            cb.addEventListener('change', function() {
                var li = this.closest('.cjc-shopping-list__item');
                var id = li.getAttribute('data-id');
                var list = getShoppingList();
                list.forEach(function(item) {
                    if (item.id === id) item.checked = !item.checked;
                });
                setShoppingList(list);
                li.classList.toggle('is-checked');
            });
        });

        container.querySelectorAll('.cjc-shopping-list__remove').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var li = this.closest('.cjc-shopping-list__item');
                var id = li.getAttribute('data-id');
                var list = getShoppingList().filter(function(item) { return item.id !== id; });
                setShoppingList(list);
                li.remove();

                if (getShoppingList().length === 0) {
                    renderShoppingList(container);
                }
            });
        });
    }

    // ==================== TOAST ====================
    function showToast(msg) {
        var container = document.getElementById('cjc-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'cjc-toast-container';
            document.body.appendChild(container);
        }

        var toast = document.createElement('div');
        toast.className = 'cjc-toast';
        toast.textContent = msg;
        container.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('is-hiding');
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    // ==================== START ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
