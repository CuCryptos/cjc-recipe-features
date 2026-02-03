<?php
/**
 * Shopping List - Handles the /shopping-list/ virtual page
 */

if (!defined('ABSPATH')) {
    exit;
}

class CJC_Shopping_List {

    public function __construct() {
        // Add any AJAX handlers here if needed
    }

    /**
     * Get the page title
     */
    public static function get_page_title() {
        return 'Shopping List';
    }
}
