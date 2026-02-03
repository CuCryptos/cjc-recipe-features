<?php
/**
 * Recipe Buttons - Injects interactive UI controls into recipe posts
 */

if (!defined('ABSPATH')) {
    exit;
}

class CJC_Recipe_Buttons {

    public function __construct() {
        add_filter('the_content', array($this, 'inject_recipe_features'), 20);
        add_action('wp_footer', array($this, 'add_floating_button'));
    }

    /**
     * Inject recipe action bar into post content
     */
    public function inject_recipe_features($content) {
        // Only modify recipe posts on single view
        if (!is_single() || !CJC_Recipe_Features::is_recipe_post()) {
            return $content;
        }

        // Build the action bar HTML
        $action_bar = $this->get_action_bar_html();

        // Find the ingredients section and inject action bar before it
        $content = $this->inject_before_ingredients($content, $action_bar);

        // Wrap ingredient lists with data attributes for JavaScript
        // Using simple regex instead of DOMDocument for PHP 8.3 compatibility
        $content = $this->wrap_ingredient_lists_simple($content);

        return $content;
    }

    /**
     * Get the action bar HTML
     */
    private function get_action_bar_html() {
        $post_id = get_the_ID();

        ob_start();
        ?>
        <div class="cjc-recipe-actions" data-post-id="<?php echo esc_attr($post_id); ?>">
            <div class="cjc-recipe-actions__row">
                <!-- Servings Selector -->
                <div class="cjc-recipe-actions__scale">
                    <label for="cjc-servings-select">Servings:</label>
                    <select id="cjc-servings-select" class="cjc-servings-select">
                        <option value="0.5">½×</option>
                        <option value="1" selected>1×</option>
                        <option value="2">2×</option>
                        <option value="3">3×</option>
                        <option value="4">4×</option>
                    </select>
                    <span class="cjc-scale-indicator" style="display: none;"></span>
                </div>

                <!-- Action Buttons -->
                <div class="cjc-recipe-actions__buttons">
                    <button type="button" class="cjc-btn cjc-btn--print" title="Print Recipe">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                        </svg>
                        <span>Print</span>
                    </button>

                    <button type="button" class="cjc-btn cjc-btn--save" title="Save Recipe">
                        <svg class="cjc-heart-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span>Save</span>
                    </button>

                    <button type="button" class="cjc-btn cjc-btn--shopping" title="Add to Shopping List">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <span>Shopping List</span>
                    </button>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Inject action bar before the ingredients section
     */
    private function inject_before_ingredients($content, $action_bar) {
        // Look for common ingredients heading patterns
        $patterns = array(
            // H2/H3/H4 with "Ingredients"
            '/(<h[2-4][^>]*>.*?ingredients.*?<\/h[2-4]>)/i',
            // Strong tag with "Ingredients"
            '/(<p><strong>.*?ingredients.*?<\/strong><\/p>)/i',
            // Bold ingredients
            '/(<p><b>.*?ingredients.*?<\/b><\/p>)/i',
        );

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $content, $matches, PREG_OFFSET_SET)) {
                $pos = $matches[0][1];
                return substr($content, 0, $pos) . $action_bar . substr($content, $pos);
            }
        }

        // Fallback: insert at the beginning of content
        return $action_bar . $content;
    }

    /**
     * Simple version using regex - more compatible with PHP 8.3
     */
    private function wrap_ingredient_lists_simple($content) {
        if (empty($content)) {
            return $content;
        }

        // Find ingredient sections and add classes to list items
        // Pattern: find <li> tags that come after an ingredients heading
        $in_ingredients = false;
        $lines = preg_split('/(<[^>]+>)/', $content, -1, PREG_SPLIT_DELIM_CAPTURE);
        $result = '';

        foreach ($lines as $line) {
            // Check for ingredients heading
            if (preg_match('/<h[2-4][^>]*>/i', $line) || preg_match('/<strong>/i', $line)) {
                $in_ingredients = false; // Reset
            }
            if ($in_ingredients === false && stripos($line, 'ingredient') !== false) {
                $in_ingredients = true;
            }
            // Check for instructions heading (end of ingredients)
            if ($in_ingredients && stripos($line, 'instruction') !== false) {
                $in_ingredients = false;
            }

            // Add class to ul/ol in ingredients section
            if ($in_ingredients && preg_match('/^<(ul|ol)(\s|>)/i', $line)) {
                $line = preg_replace('/^<(ul|ol)/i', '<$1 class="cjc-ingredients-list"', $line);
            }

            // Add class and data attribute to li in ingredients section
            if ($in_ingredients && preg_match('/^<li/i', $line)) {
                $line = preg_replace('/^<li/i', '<li class="cjc-ingredient-item"', $line);
            }

            $result .= $line;
        }

        // Now add data-original attributes to ingredient items
        $result = preg_replace_callback(
            '/<li class="cjc-ingredient-item"[^>]*>(.*?)<\/li>/is',
            function($matches) {
                $text = strip_tags($matches[1]);
                $text = htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
                return '<li class="cjc-ingredient-item" data-original="' . $text . '">' . $matches[1] . '</li>';
            },
            $result
        );

        return $result;
    }

    /**
     * Wrap ingredient lists with data attributes for JavaScript interaction (DOMDocument version - backup)
     */
    private function wrap_ingredient_lists($content) {
        if (empty($content)) {
            return $content;
        }

        // Load content into DOMDocument for proper HTML manipulation
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);

        // Preserve encoding - use UTF-8 meta tag
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><div id="cjc-wrapper">' . $content . '</div></body></html>';
        $dom->loadHTML($html);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        // Find headings that contain "ingredient"
        $headings = $xpath->query('//*[self::h2 or self::h3 or self::h4 or self::strong or self::b]');
        $in_ingredients_section = false;

        foreach ($headings as $heading) {
            $textContent = $heading->textContent ?? '';
            $text = strtolower(trim($textContent));

            if (strpos($text, 'ingredient') !== false) {
                $in_ingredients_section = true;

                // Find the next ul or ol
                $next = $heading->parentNode;
                if ($next->nodeName === 'p') {
                    $next = $next->nextSibling;
                } else {
                    $next = $heading->nextSibling;
                }

                while ($next) {
                    // Skip whitespace text nodes
                    if ($next->nodeType === XML_TEXT_NODE) {
                        $next = $next->nextSibling;
                        continue;
                    }

                    if ($next->nodeName === 'ul' || $next->nodeName === 'ol') {
                        // Add class to the list
                        $existing_class = $next->getAttribute('class') ?? '';
                        $next->setAttribute('class', trim($existing_class . ' cjc-ingredients-list'));

                        // Add data attributes to each list item
                        $items = $xpath->query('.//li', $next);
                        foreach ($items as $index => $item) {
                            $existingClass = $item->getAttribute('class') ?? '';
                            $item->setAttribute('class', trim($existingClass . ' cjc-ingredient-item'));
                            $itemText = $item->textContent ?? '';
                            $item->setAttribute('data-original', $itemText);
                        }
                        break;
                    }

                    // Stop if we hit another heading
                    if (in_array($next->nodeName, array('h2', 'h3', 'h4'))) {
                        break;
                    }

                    $next = $next->nextSibling;
                }
            } elseif ($in_ingredients_section && $text !== '' && strpos($text, 'instruction') !== false) {
                $in_ingredients_section = false;
            }
        }

        // Extract just the content (without the wrapper div)
        $wrapper = $dom->getElementById('cjc-wrapper');
        if ($wrapper) {
            $html = '';
            foreach ($wrapper->childNodes as $child) {
                $html .= $dom->saveHTML($child);
            }
            // Clean up any artifacts from the full HTML document
            return $html;
        }

        return $content;
    }

    /**
     * Add floating action button for mobile/scrolling
     */
    public function add_floating_button() {
        if (!is_single() || !CJC_Recipe_Features::is_recipe_post()) {
            return;
        }
        ?>
        <div class="cjc-floating-btn" style="display: none;">
            <button type="button" class="cjc-fab cjc-fab--main" title="Recipe Actions">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6"></line>
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="18" x2="20" y2="18"></line>
                </svg>
            </button>
            <div class="cjc-fab__menu">
                <button type="button" class="cjc-fab cjc-fab--print" title="Print">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9"></polyline>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                        <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                </button>
                <button type="button" class="cjc-fab cjc-fab--save" title="Save">
                    <svg class="cjc-heart-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                <button type="button" class="cjc-fab cjc-fab--shopping" title="Shopping List">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Toast notification container -->
        <div id="cjc-toast-container"></div>
        <?php
    }
}
