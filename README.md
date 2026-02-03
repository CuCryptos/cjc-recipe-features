# CJC Recipe Features

A lightweight WordPress plugin that adds print, save, scale, and shopping list features to recipe posts.

## Features

- **Print Recipe** - Clean, printer-friendly layout that hides site chrome
- **Save/Bookmark Recipes** - Save favorite recipes to browser localStorage
- **Ingredient Scaling** - Scale ingredient amounts from 0.5x to 4x
- **Shopping List** - Add ingredients to a shopping list, combines duplicates
- **Virtual Pages** - `/saved-recipes/` and `/shopping-list/` pages

## Requirements

- WordPress 5.0+
- PHP 7.4+ (tested on PHP 8.3)

## Installation

1. Download the [latest release](https://github.com/CuCryptos/cjc-recipe-features/releases) or clone this repo
2. Upload to `/wp-content/plugins/cjc-recipe-features/`
3. Activate the plugin in WordPress admin
4. Go to **Settings > Permalinks** and click "Save Changes" (registers virtual page URLs)

## Configuration

By default, the plugin targets posts in category ID 26 (Recipes) and its child categories. To change this, edit the constant in `cjc-recipe-features.php`:

```php
define('CJC_RECIPE_CATEGORY_ID', 26);
```

## Usage

### On Recipe Posts

The plugin automatically adds an action bar to recipe posts with:

- **Servings dropdown** - Select 0.5x, 1x, 2x, 3x, or 4x to scale ingredients
- **Print button** - Opens browser print dialog
- **Save button** - Toggles recipe saved state (heart icon fills when saved)
- **Shopping List button** - Adds all ingredients to your shopping list

### Ingredient Scaling

The plugin automatically detects ingredient lists by looking for headings containing "Ingredients" followed by a `<ul>` or `<ol>` list. Amounts at the beginning of list items are parsed and scaled.

Supported formats:
- Whole numbers: `2 cups flour`
- Decimals: `1.5 cups sugar`
- Fractions: `1/2 cup butter`
- Mixed fractions: `1 1/2 cups milk`
- Unicode fractions: `½ cup water`

### Virtual Pages

- **/saved-recipes/** - Displays all saved recipes in a grid
- **/shopping-list/** - Displays shopping list with checkboxes, grouped by recipe

## Data Storage

All data is stored in the browser's localStorage:

- `cjc_saved_recipes` - Array of saved recipe objects
- `cjc_shopping_list` - Array of shopping list items
- `cjc_recipe_scale_{post_id}` - Scaling preference per recipe

No server-side storage or database tables are created.

## File Structure

```
cjc-recipe-features/
├── cjc-recipe-features.php      # Main plugin file
├── assets/
│   ├── css/
│   │   ├── recipe-features.css  # Main styles
│   │   └── print.css            # Print media styles
│   └── js/
│       └── recipe-features-full.js  # All JavaScript functionality
└── README.md
```

## Changelog

### 1.0.2
- Initial public release
- PHP 8.3 compatible
- All features working: print, save, scale, shopping list

## License

GPL v2 or later

## Author

Curtis Vaughan - [CurtisJCooks.com](https://curtisjcooks.com)
