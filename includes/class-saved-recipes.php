<?php
/**
 * Saved Recipes - Handles the /saved-recipes/ virtual page
 */

if (!defined('ABSPATH')) {
    exit;
}

class CJC_Saved_Recipes {

    public function __construct() {
        add_action('wp_ajax_cjc_get_recipe_data', array($this, 'ajax_get_recipe_data'));
        add_action('wp_ajax_nopriv_cjc_get_recipe_data', array($this, 'ajax_get_recipe_data'));
    }

    /**
     * AJAX handler to get recipe data for saved recipes display
     */
    public function ajax_get_recipe_data() {
        $post_ids = isset($_POST['post_ids']) ? array_map('intval', $_POST['post_ids']) : array();

        if (empty($post_ids)) {
            wp_send_json_success(array());
        }

        $recipes = array();

        foreach ($post_ids as $post_id) {
            $post = get_post($post_id);
            if ($post && $post->post_status === 'publish') {
                $recipes[] = array(
                    'id' => $post_id,
                    'title' => get_the_title($post_id),
                    'slug' => $post->post_name,
                    'url' => get_permalink($post_id),
                    'image' => get_the_post_thumbnail_url($post_id, 'medium') ?: '',
                    'excerpt' => wp_trim_words(get_the_excerpt($post_id), 20),
                );
            }
        }

        wp_send_json_success($recipes);
    }

    /**
     * Get the page title
     */
    public static function get_page_title() {
        return 'Saved Recipes';
    }
}
