<?php
/**
 * Content Parser for Recipe Features
 *
 * Parses recipe content from standard WordPress posts to extract
 * structured ingredient and instruction data.
 */

if (!defined('ABSPATH')) {
    exit;
}

class CJC_Content_Parser {

    // Common units for ingredient parsing
    private static $units = array(
        'cup', 'cups',
        'tablespoon', 'tablespoons', 'tbsp', 'Tbsp', 'T',
        'teaspoon', 'teaspoons', 'tsp', 't',
        'ounce', 'ounces', 'oz',
        'pound', 'pounds', 'lb', 'lbs',
        'gram', 'grams', 'g',
        'kilogram', 'kilograms', 'kg',
        'milliliter', 'milliliters', 'ml', 'mL',
        'liter', 'liters', 'l', 'L',
        'pinch', 'pinches',
        'dash', 'dashes',
        'clove', 'cloves',
        'slice', 'slices',
        'piece', 'pieces',
        'can', 'cans',
        'package', 'packages', 'pkg',
        'bunch', 'bunches',
        'head', 'heads',
        'stalk', 'stalks',
        'sprig', 'sprigs',
        'leaf', 'leaves',
        'small', 'medium', 'large',
    );

    // Fraction map for parsing
    private static $fraction_map = array(
        '½' => 0.5,
        '⅓' => 0.333,
        '⅔' => 0.667,
        '¼' => 0.25,
        '¾' => 0.75,
        '⅕' => 0.2,
        '⅖' => 0.4,
        '⅗' => 0.6,
        '⅘' => 0.8,
        '⅙' => 0.167,
        '⅚' => 0.833,
        '⅛' => 0.125,
        '⅜' => 0.375,
        '⅝' => 0.625,
        '⅞' => 0.875,
    );

    /**
     * Parse an ingredient string into structured data
     *
     * @param string $text Raw ingredient text (e.g., "1 1/2 cups flour")
     * @return array Structured ingredient data
     */
    public static function parse_ingredient($text) {
        if ($text === null) {
            $text = '';
        }
        $text = trim((string) $text);
        $original = $text;

        // Default structure
        $result = array(
            'original' => $original,
            'amount' => null,
            'unit' => null,
            'item' => $text,
            'notes' => null,
        );

        // Extract notes in parentheses
        if (preg_match('/\(([^)]+)\)/', $text, $matches)) {
            $result['notes'] = $matches[1];
            $text = trim(str_replace($matches[0], '', $text));
        }

        // Extract notes after comma
        if (strpos($text, ',') !== false) {
            $parts = explode(',', $text, 2);
            $text = trim($parts[0]);
            $result['notes'] = isset($result['notes'])
                ? $result['notes'] . ', ' . trim($parts[1])
                : trim($parts[1]);
        }

        // Parse amount at the beginning
        $amount = self::parse_amount($text);
        if ($amount !== null) {
            $result['amount'] = $amount['value'];
            $text = trim($amount['remaining']);
        }

        // Parse unit
        $unit = self::parse_unit($text);
        if ($unit !== null) {
            $result['unit'] = $unit['unit'];
            $text = trim($unit['remaining']);
        }

        // Remaining text is the item
        // Remove leading "of " if present
        $text = preg_replace('/^of\s+/i', '', $text);
        $result['item'] = trim($text);

        return $result;
    }

    /**
     * Parse amount from the beginning of a string
     *
     * @param string $text Text to parse
     * @return array|null Amount value and remaining text
     */
    private static function parse_amount($text) {
        // Pattern for amounts: handles "1", "1.5", "1/2", "1 1/2", unicode fractions
        $pattern = '/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*)\s*/';

        // First check for unicode fractions
        foreach (self::$fraction_map as $unicode => $decimal) {
            if (strpos($text, $unicode) === 0) {
                return array(
                    'value' => $decimal,
                    'remaining' => trim(substr($text, strlen($unicode)))
                );
            }
            // Check for whole number + unicode fraction (e.g., "1½")
            if (preg_match('/^(\d+)\s*' . preg_quote($unicode, '/') . '\s*/', $text, $matches)) {
                return array(
                    'value' => (float) $matches[1] + $decimal,
                    'remaining' => trim(substr($text, strlen($matches[0])))
                );
            }
        }

        // Check for standard fraction patterns
        if (preg_match($pattern, $text, $matches)) {
            $amount_str = trim($matches[1]);
            $remaining = trim(substr($text, strlen($matches[0])));

            // Handle mixed fractions like "1 1/2"
            if (preg_match('/^(\d+)\s+(\d+)\/(\d+)$/', $amount_str, $frac)) {
                $value = (float) $frac[1] + ((float) $frac[2] / (float) $frac[3]);
            }
            // Handle simple fractions like "1/2"
            elseif (preg_match('/^(\d+)\/(\d+)$/', $amount_str, $frac)) {
                $value = (float) $frac[1] / (float) $frac[2];
            }
            // Handle decimals and whole numbers
            else {
                $value = (float) $amount_str;
            }

            return array(
                'value' => $value,
                'remaining' => $remaining
            );
        }

        return null;
    }

    /**
     * Parse unit from the beginning of a string
     *
     * @param string $text Text to parse
     * @return array|null Unit and remaining text
     */
    private static function parse_unit($text) {
        // Sort units by length (longest first) to match "tablespoons" before "T"
        $sorted_units = self::$units;
        usort($sorted_units, function($a, $b) {
            return strlen($b) - strlen($a);
        });

        foreach ($sorted_units as $unit) {
            // Check for unit at beginning of string (case-insensitive for most)
            $pattern = '/^' . preg_quote($unit, '/') . '\.?\s+/i';
            if (preg_match($pattern, $text, $matches)) {
                return array(
                    'unit' => strtolower($unit),
                    'remaining' => trim(substr($text, strlen($matches[0])))
                );
            }
        }

        return null;
    }

    /**
     * Scale an ingredient amount
     *
     * @param float $amount Original amount
     * @param float $multiplier Scale multiplier
     * @return float Scaled amount
     */
    public static function scale_amount($amount, $multiplier) {
        return $amount * $multiplier;
    }

    /**
     * Format an amount for display (convert decimals to fractions where appropriate)
     *
     * @param float $number Amount to format
     * @return string Formatted amount
     */
    public static function format_amount($number) {
        if ($number === null) {
            return '';
        }

        // Handle zero
        if ($number == 0) {
            return '0';
        }

        // Separate whole and fractional parts
        $whole = floor($number);
        $decimal = $number - $whole;

        // Round to nearest common fraction
        $fractions = array(
            0 => '',
            0.125 => '⅛',
            0.25 => '¼',
            0.333 => '⅓',
            0.375 => '⅜',
            0.5 => '½',
            0.625 => '⅝',
            0.667 => '⅔',
            0.75 => '¾',
            0.875 => '⅞',
            1 => '',
        );

        // Find closest fraction
        $closest_frac = 0;
        $min_diff = 1;
        foreach (array_keys($fractions) as $frac) {
            $diff = abs($decimal - $frac);
            if ($diff < $min_diff) {
                $min_diff = $diff;
                $closest_frac = $frac;
            }
        }

        // Handle rounding up to next whole number
        if ($closest_frac >= 1) {
            $whole++;
            $closest_frac = 0;
        }

        // Build result
        $result = '';
        if ($whole > 0) {
            $result .= $whole;
        }
        if ($fractions[$closest_frac] !== '') {
            if ($result !== '') {
                $result .= ' ';
            }
            $result .= $fractions[$closest_frac];
        }

        // If result is empty (very small number), show decimal
        if ($result === '') {
            return number_format($number, 2);
        }

        return $result;
    }

    /**
     * Parse ingredients from HTML content
     *
     * @param string $content Post content HTML
     * @return array Array of parsed ingredients
     */
    public static function extract_ingredients_from_content($content) {
        $ingredients = array();

        // Load content into DOMDocument
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $content);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        // Find lists that follow an ingredients heading
        $headings = $xpath->query('//h2|//h3|//h4|//strong');

        foreach ($headings as $heading) {
            $text = strtolower(trim($heading->textContent));
            if (strpos($text, 'ingredient') !== false) {
                // Find the next list
                $next = $heading->nextSibling;
                while ($next) {
                    if ($next->nodeName === 'ul' || $next->nodeName === 'ol') {
                        $items = $xpath->query('.//li', $next);
                        foreach ($items as $item) {
                            $ingredient_text = trim($item->textContent);
                            if (!empty($ingredient_text)) {
                                $ingredients[] = self::parse_ingredient($ingredient_text);
                            }
                        }
                        break;
                    }
                    // Skip text nodes
                    if ($next->nodeType === XML_TEXT_NODE && trim($next->textContent) === '') {
                        $next = $next->nextSibling;
                        continue;
                    }
                    // Stop if we hit another heading
                    if (in_array($next->nodeName, array('h2', 'h3', 'h4'))) {
                        break;
                    }
                    $next = $next->nextSibling;
                }
            }
        }

        return $ingredients;
    }

    /**
     * Normalize a unit to its standard form
     *
     * @param string $unit Unit to normalize
     * @return string Normalized unit
     */
    public static function normalize_unit($unit) {
        if ($unit === null || $unit === '') {
            return '';
        }
        $unit = strtolower(trim((string) $unit));

        $normalizations = array(
            'tbsp' => 'tablespoon',
            't' => 'tablespoon',
            'tsp' => 'teaspoon',
            'oz' => 'ounce',
            'lb' => 'pound',
            'lbs' => 'pound',
            'g' => 'gram',
            'kg' => 'kilogram',
            'ml' => 'milliliter',
            'l' => 'liter',
            'pkg' => 'package',
            // Plurals to singular
            'cups' => 'cup',
            'tablespoons' => 'tablespoon',
            'teaspoons' => 'teaspoon',
            'ounces' => 'ounce',
            'pounds' => 'pound',
            'grams' => 'gram',
            'kilograms' => 'kilogram',
            'milliliters' => 'milliliter',
            'liters' => 'liter',
            'cloves' => 'clove',
            'slices' => 'slice',
            'pieces' => 'piece',
            'cans' => 'can',
            'packages' => 'package',
            'bunches' => 'bunch',
            'heads' => 'head',
            'stalks' => 'stalk',
            'sprigs' => 'sprig',
            'leaves' => 'leaf',
            'pinches' => 'pinch',
            'dashes' => 'dash',
        );

        return isset($normalizations[$unit]) ? $normalizations[$unit] : $unit;
    }

    /**
     * Combine duplicate ingredients in a list
     *
     * @param array $ingredients Array of parsed ingredients
     * @return array Combined ingredients
     */
    public static function combine_ingredients($ingredients) {
        $combined = array();

        foreach ($ingredients as $ing) {
            $item = isset($ing['item']) ? (string) $ing['item'] : '';
            $key = strtolower(trim($item));
            $unit = isset($ing['unit']) ? self::normalize_unit($ing['unit']) : '';

            // Create unique key from item + unit
            $combo_key = $key . '|' . $unit;

            if (isset($combined[$combo_key])) {
                // Add amounts
                if ($ing['amount'] !== null && $combined[$combo_key]['amount'] !== null) {
                    $combined[$combo_key]['amount'] += $ing['amount'];
                }
                // Merge notes
                if (!empty($ing['notes'])) {
                    $existing_notes = isset($combined[$combo_key]['notes']) ? (string) $combined[$combo_key]['notes'] : '';
                    $notes_str = (string) $ing['notes'];
                    if (strpos($existing_notes, $notes_str) === false) {
                        $combined[$combo_key]['notes'] = trim($existing_notes . ', ' . $notes_str, ', ');
                    }
                }
            } else {
                $combined[$combo_key] = $ing;
            }
        }

        return array_values($combined);
    }
}
