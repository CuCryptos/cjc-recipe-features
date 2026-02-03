<?php
/**
 * Plugin Name: CJC Recipe Features
 * Plugin URI: https://curtisjcooks.com
 * Description: Adds print, save, scale, and shopping list features to recipe posts
 * Version: 1.0.2
 * Author: Curtis Vaughan
 * Author URI: https://curtisjcooks.com
 * License: GPL v2 or later
 * Text Domain: cjc-recipe-features
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CJC_RECIPE_FEATURES_VERSION', '1.0.2');
define('CJC_RECIPE_FEATURES_PATH', plugin_dir_path(__FILE__));
define('CJC_RECIPE_FEATURES_URL', plugin_dir_url(__FILE__));
define('CJC_RECIPE_CATEGORY_ID', 26);

class CJC_Recipe_Features {

    private static $instance = null;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_filter('the_content', array($this, 'inject_recipe_features'), 20);
        add_action('wp_footer', array($this, 'add_footer_elements'));
        add_action('init', array($this, 'register_rewrite_rules'));
        add_filter('query_vars', array($this, 'add_query_vars'));
        add_action('template_redirect', array($this, 'handle_virtual_pages'));
    }

    public function register_rewrite_rules() {
        add_rewrite_rule('^saved-recipes/?$', 'index.php?cjc_page=saved-recipes', 'top');
        add_rewrite_rule('^shopping-list/?$', 'index.php?cjc_page=shopping-list', 'top');
    }

    public function add_query_vars($vars) {
        $vars[] = 'cjc_page';
        return $vars;
    }

    public function handle_virtual_pages() {
        $page = get_query_var('cjc_page');
        if (empty($page)) {
            return;
        }

        // Load assets for virtual pages
        add_action('wp_enqueue_scripts', array($this, 'enqueue_page_assets'), 20);

        status_header(200);

        get_header();

        if ($page === 'saved-recipes') {
            echo '<div class="cjc-saved-recipes-page">';
            echo '<header class="cjc-page-header"><h1>Saved Recipes</h1><p>Your favorite recipes.</p></header>';
            echo '<div class="cjc-page-actions"><button type="button" id="cjc-clear-saved" class="cjc-btn"><span>Clear All</span></button></div>';
            echo '<div id="cjc-saved-recipes-container"><p>Loading...</p></div>';
            echo '</div>';
        } elseif ($page === 'shopping-list') {
            echo '<div class="cjc-shopping-list-page">';
            echo '<header class="cjc-page-header"><h1>Shopping List</h1><p>Your ingredients list.</p></header>';
            echo '<div class="cjc-page-actions">';
            echo '<button type="button" id="cjc-print-list" class="cjc-btn" onclick="window.print()"><span>Print</span></button>';
            echo '<button type="button" id="cjc-clear-checked" class="cjc-btn"><span>Clear Checked</span></button>';
            echo '<button type="button" id="cjc-clear-all" class="cjc-btn"><span>Clear All</span></button>';
            echo '</div>';
            echo '<div id="cjc-shopping-list-container"><p>Loading...</p></div>';
            echo '</div>';
        }

        get_footer();
        exit;
    }

    public function enqueue_page_assets() {
        wp_enqueue_style('cjc-recipe-features', CJC_RECIPE_FEATURES_URL . 'assets/css/recipe-features.css', array(), CJC_RECIPE_FEATURES_VERSION);
        wp_enqueue_script('cjc-recipe-features', CJC_RECIPE_FEATURES_URL . 'assets/js/recipe-features-full.js', array(), CJC_RECIPE_FEATURES_VERSION, true);
        wp_localize_script('cjc-recipe-features', 'cjcRecipeData', array('isRecipe' => false, 'siteUrl' => home_url()));
    }

    public function enqueue_assets() {
        if (!is_single() || !self::is_recipe_post()) {
            return;
        }

        wp_enqueue_style(
            'cjc-recipe-features',
            CJC_RECIPE_FEATURES_URL . 'assets/css/recipe-features.css',
            array(),
            CJC_RECIPE_FEATURES_VERSION
        );

        wp_enqueue_style(
            'cjc-recipe-features-print',
            CJC_RECIPE_FEATURES_URL . 'assets/css/print.css',
            array(),
            CJC_RECIPE_FEATURES_VERSION,
            'print'
        );

        wp_enqueue_script(
            'cjc-recipe-features',
            CJC_RECIPE_FEATURES_URL . 'assets/js/recipe-features-full.js',
            array(),
            CJC_RECIPE_FEATURES_VERSION,
            true
        );

        wp_localize_script('cjc-recipe-features', 'cjcRecipeData', array(
            'postId' => get_the_ID(),
            'postTitle' => get_the_title(),
            'postSlug' => get_post_field('post_name', get_the_ID()),
            'postImage' => get_the_post_thumbnail_url(get_the_ID(), 'medium') ?: '',
            'isRecipe' => true,
        ));
    }

    public static function is_recipe_post($post_id = null) {
        if (!$post_id) {
            $post_id = get_the_ID();
        }
        if (!$post_id) {
            return false;
        }

        $recipe_categories = get_term_children(CJC_RECIPE_CATEGORY_ID, 'category');
        if (!is_array($recipe_categories)) {
            $recipe_categories = array();
        }
        $recipe_categories[] = CJC_RECIPE_CATEGORY_ID;

        return has_category($recipe_categories, $post_id);
    }

    public function inject_recipe_features($content) {
        if (!is_single() || !self::is_recipe_post()) {
            return $content;
        }

        $post_id = get_the_ID();

        $action_bar = '
        <div class="cjc-recipe-actions" data-post-id="' . esc_attr($post_id) . '">
            <div class="cjc-recipe-actions__row">
                <div class="cjc-recipe-actions__scale">
                    <label for="cjc-servings-select">Servings:</label>
                    <select id="cjc-servings-select" class="cjc-servings-select">
                        <option value="0.5">1/2x</option>
                        <option value="1" selected>1x</option>
                        <option value="2">2x</option>
                        <option value="3">3x</option>
                        <option value="4">4x</option>
                    </select>
                    <span class="cjc-scale-indicator" style="display: none;"></span>
                </div>
                <div class="cjc-recipe-actions__buttons">
                    <button type="button" class="cjc-btn cjc-btn--print" onclick="window.print()">
                        <span>Print</span>
                    </button>
                    <button type="button" class="cjc-btn cjc-btn--save" id="cjc-save-btn">
                        <span>Save</span>
                    </button>
                    <button type="button" class="cjc-btn cjc-btn--shopping" id="cjc-shopping-btn">
                        <span>Shopping List</span>
                    </button>
                </div>
            </div>
        </div>';

        return $action_bar . $content;
    }

    public function add_footer_elements() {
        if (!is_single() || !self::is_recipe_post()) {
            return;
        }
        echo '<div id="cjc-toast-container"></div>';
    }
}

add_action('plugins_loaded', function() {
    CJC_Recipe_Features::instance();
});

register_activation_hook(__FILE__, function() {
    CJC_Recipe_Features::instance();
    flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
