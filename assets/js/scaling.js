/**
 * CJC Recipe Features - Ingredient Scaling
 *
 * Handles parsing ingredient amounts and scaling them
 */

(function() {
    'use strict';

    // Fraction character to decimal mapping
    const FRACTION_MAP = {
        '½': 0.5,
        '⅓': 0.333,
        '⅔': 0.667,
        '¼': 0.25,
        '¾': 0.75,
        '⅕': 0.2,
        '⅖': 0.4,
        '⅗': 0.6,
        '⅘': 0.8,
        '⅙': 0.167,
        '⅚': 0.833,
        '⅛': 0.125,
        '⅜': 0.375,
        '⅝': 0.625,
        '⅞': 0.875
    };

    // Decimal to fraction mapping (for display)
    const DECIMAL_TO_FRACTION = {
        0.125: '⅛',
        0.25: '¼',
        0.333: '⅓',
        0.375: '⅜',
        0.5: '½',
        0.625: '⅝',
        0.667: '⅔',
        0.75: '¾',
        0.875: '⅞'
    };

    // Common units for parsing
    const UNITS = [
        'tablespoons', 'tablespoon', 'tbsp', 'Tbsp',
        'teaspoons', 'teaspoon', 'tsp',
        'cups', 'cup',
        'ounces', 'ounce', 'oz',
        'pounds', 'pound', 'lbs', 'lb',
        'grams', 'gram', 'g',
        'kilograms', 'kilogram', 'kg',
        'milliliters', 'milliliter', 'ml', 'mL',
        'liters', 'liter', 'L',
        'pinches', 'pinch',
        'dashes', 'dash',
        'cloves', 'clove',
        'slices', 'slice',
        'pieces', 'piece',
        'cans', 'can',
        'packages', 'package', 'pkg',
        'bunches', 'bunch',
        'heads', 'head',
        'stalks', 'stalk',
        'sprigs', 'sprig',
        'leaves', 'leaf',
        'small', 'medium', 'large'
    ];

    /**
     * Parse an ingredient string into structured data
     * @param {string} text - Raw ingredient text
     * @returns {Object} Parsed ingredient data
     */
    function parseIngredient(text) {
        text = text.trim();
        const original = text;

        const result = {
            original: original,
            amount: null,
            unit: null,
            item: text,
            notes: null,
            amountStart: -1,
            amountEnd: -1
        };

        // Extract notes in parentheses
        const parenMatch = text.match(/\(([^)]+)\)/);
        if (parenMatch) {
            result.notes = parenMatch[1];
            text = text.replace(parenMatch[0], '').trim();
        }

        // Extract notes after comma
        const commaIdx = text.indexOf(',');
        if (commaIdx !== -1) {
            const afterComma = text.substring(commaIdx + 1).trim();
            text = text.substring(0, commaIdx).trim();
            result.notes = result.notes
                ? result.notes + ', ' + afterComma
                : afterComma;
        }

        // Parse amount at beginning
        const amountResult = parseAmount(text);
        if (amountResult) {
            result.amount = amountResult.value;
            result.amountStart = 0;
            result.amountEnd = amountResult.length;
            text = text.substring(amountResult.length).trim();
        }

        // Parse unit
        const unitResult = parseUnit(text);
        if (unitResult) {
            result.unit = unitResult.unit;
            text = text.substring(unitResult.length).trim();
        }

        // Remove leading "of "
        text = text.replace(/^of\s+/i, '');
        result.item = text.trim();

        return result;
    }

    /**
     * Parse amount from beginning of string
     * @param {string} text - Text to parse
     * @returns {Object|null} Amount value and string length consumed
     */
    function parseAmount(text) {
        // Check for unicode fractions first
        for (const [unicode, decimal] of Object.entries(FRACTION_MAP)) {
            // Check for whole number + unicode fraction (e.g., "1½")
            const mixedMatch = text.match(new RegExp(`^(\\d+)\\s*${escapeRegex(unicode)}`));
            if (mixedMatch) {
                return {
                    value: parseInt(mixedMatch[1]) + decimal,
                    length: mixedMatch[0].length
                };
            }
            // Check for standalone unicode fraction
            if (text.startsWith(unicode)) {
                return {
                    value: decimal,
                    length: unicode.length
                };
            }
        }

        // Check for mixed fraction (e.g., "1 1/2")
        const mixedFracMatch = text.match(/^(\d+)\s+(\d+)\/(\d+)/);
        if (mixedFracMatch) {
            const whole = parseInt(mixedFracMatch[1]);
            const numer = parseInt(mixedFracMatch[2]);
            const denom = parseInt(mixedFracMatch[3]);
            return {
                value: whole + (numer / denom),
                length: mixedFracMatch[0].length
            };
        }

        // Check for simple fraction (e.g., "1/2")
        const fracMatch = text.match(/^(\d+)\/(\d+)/);
        if (fracMatch) {
            return {
                value: parseInt(fracMatch[1]) / parseInt(fracMatch[2]),
                length: fracMatch[0].length
            };
        }

        // Check for decimal or whole number
        const numMatch = text.match(/^(\d+\.?\d*)/);
        if (numMatch) {
            return {
                value: parseFloat(numMatch[1]),
                length: numMatch[0].length
            };
        }

        return null;
    }

    /**
     * Parse unit from beginning of string
     * @param {string} text - Text to parse
     * @returns {Object|null} Unit and string length consumed
     */
    function parseUnit(text) {
        const lowerText = text.toLowerCase();

        // Sort units by length (longest first)
        const sortedUnits = [...UNITS].sort((a, b) => b.length - a.length);

        for (const unit of sortedUnits) {
            const pattern = new RegExp(`^${escapeRegex(unit)}\\.?\\s+`, 'i');
            const match = lowerText.match(pattern);
            if (match) {
                return {
                    unit: unit.toLowerCase(),
                    length: match[0].length
                };
            }
            // Also check if unit is at end of text
            const endPattern = new RegExp(`^${escapeRegex(unit)}\\.?$`, 'i');
            const endMatch = lowerText.match(endPattern);
            if (endMatch) {
                return {
                    unit: unit.toLowerCase(),
                    length: endMatch[0].length
                };
            }
        }

        return null;
    }

    /**
     * Scale an amount by a multiplier
     * @param {number} amount - Original amount
     * @param {number} multiplier - Scale factor
     * @returns {number} Scaled amount
     */
    function scaleAmount(amount, multiplier) {
        return amount * multiplier;
    }

    /**
     * Format an amount for display (convert to fractions where appropriate)
     * @param {number} number - Amount to format
     * @returns {string} Formatted amount
     */
    function formatAmount(number) {
        if (number === null || number === undefined) {
            return '';
        }

        if (number === 0) {
            return '0';
        }

        const whole = Math.floor(number);
        const decimal = number - whole;

        // Find closest fraction
        let closestFrac = 0;
        let minDiff = 1;

        const fractionValues = [0, 0.125, 0.25, 0.333, 0.375, 0.5, 0.625, 0.667, 0.75, 0.875, 1];

        for (const frac of fractionValues) {
            const diff = Math.abs(decimal - frac);
            if (diff < minDiff) {
                minDiff = diff;
                closestFrac = frac;
            }
        }

        // Handle rounding up to next whole
        let finalWhole = whole;
        let finalFrac = closestFrac;
        if (closestFrac >= 1) {
            finalWhole++;
            finalFrac = 0;
        }

        // Build result
        let result = '';
        if (finalWhole > 0) {
            result += finalWhole;
        }

        if (finalFrac > 0 && DECIMAL_TO_FRACTION[finalFrac]) {
            if (result !== '') {
                result += ' ';
            }
            result += DECIMAL_TO_FRACTION[finalFrac];
        }

        // If result is empty (very small number), show decimal
        if (result === '') {
            return number.toFixed(2);
        }

        return result;
    }

    /**
     * Escape special regex characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Update an ingredient element with scaled amounts
     * @param {HTMLElement} element - Ingredient list item
     * @param {number} multiplier - Scale factor
     */
    function updateIngredientDisplay(element, multiplier) {
        const original = element.getAttribute('data-original');
        if (!original) return;

        const parsed = parseIngredient(original);

        if (parsed.amount !== null) {
            const scaled = scaleAmount(parsed.amount, multiplier);
            const formatted = formatAmount(scaled);

            // Rebuild the ingredient text with scaled amount
            let newText = '';

            // Add amount
            newText += `<span class="cjc-ingredient-amount">${formatted}</span>`;

            // Add unit if present
            if (parsed.unit) {
                newText += ' ' + parsed.unit;
            }

            // Add item
            if (parsed.item) {
                newText += ' ' + parsed.item;
            }

            // Add notes if present
            if (parsed.notes) {
                newText += ', ' + parsed.notes;
            }

            element.innerHTML = newText;

            // Add scaled indicator class
            if (multiplier !== 1) {
                element.classList.add('is-scaled');
            } else {
                element.classList.remove('is-scaled');
            }
        }
    }

    /**
     * Reset ingredient to original text
     * @param {HTMLElement} element - Ingredient list item
     */
    function resetIngredient(element) {
        const original = element.getAttribute('data-original');
        if (original) {
            element.textContent = original;
            element.classList.remove('is-scaled');
        }
    }

    // Export to global namespace
    window.CJCScaling = {
        parseIngredient: parseIngredient,
        scaleAmount: scaleAmount,
        formatAmount: formatAmount,
        updateIngredientDisplay: updateIngredientDisplay,
        resetIngredient: resetIngredient
    };
})();
