<?php
/**
 * Template for the Saved Recipes page
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();
?>

<div class="cjc-saved-recipes-page">
    <header class="cjc-page-header">
        <h1>Saved Recipes</h1>
        <p>Your collection of favorite recipes, saved for easy access.</p>
    </header>

    <div class="cjc-page-actions">
        <button type="button" id="cjc-clear-saved" class="cjc-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Clear All</span>
        </button>
    </div>

    <div id="cjc-saved-recipes-container">
        <!-- Content loaded via JavaScript -->
        <div class="cjc-loading">
            <p>Loading saved recipes...</p>
        </div>
    </div>
</div>

<?php
get_footer();
