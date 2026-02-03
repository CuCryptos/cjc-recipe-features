<?php
/**
 * Template for the Shopping List page
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>

<div class="cjc-shopping-list-page">
    <header class="cjc-page-header">
        <h1>Shopping List</h1>
        <p>Your compiled shopping list from recipe ingredients.</p>
    </header>

    <div class="cjc-page-actions">
        <button type="button" id="cjc-print-list" class="cjc-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            <span>Print List</span>
        </button>

        <button type="button" id="cjc-clear-checked" class="cjc-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span>Clear Checked</span>
        </button>

        <button type="button" id="cjc-clear-all" class="cjc-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Clear All</span>
        </button>
    </div>

    <div id="cjc-shopping-list-container">
        <!-- Content loaded via JavaScript -->
        <div class="cjc-loading">
            <p>Loading shopping list...</p>
        </div>
    </div>
</div>

<?php
get_footer();
