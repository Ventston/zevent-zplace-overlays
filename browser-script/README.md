# ZEvent Place Overlay - Modular Build System

This directory contains the modular source code for the zevent-place-overlay userscript, now split into multiple files for better maintainability.

## Project Structure

The userscript has been split into the following modules:

### Source Files (`src/` directory)

1. **`meta.js`** - Tampermonkey metadata header with script information, grants, and URLs
2. **`constants.js`** - Global constants and configuration variables
3. **`utils.js`** - Utility functions (logging, sanitization, time formatting)
4. **`overlay-manager.js`** - Core overlay management functions (loading, reloading, DOM manipulation)
5. **`ui-components.js`** - UI creation and management functions
6. **`event-handlers.js`** - Event handling functions for user interactions
7. **`network.js`** - API calls and version checking functions
8. **`styles.js`** - CSS styling and GM_addStyle call
9. **`main.js`** - Main execution logic and initialization

### Build System

- **`build-script.js`** - Node.js script that combines all source files into the final userscript
- **`package.json`** - Node.js project configuration
- **`zevent-place-overlay.user.js`** - Generated final userscript (output file)

## Building the Userscript

### Prerequisites
- Node.js installed on your system

### Build Process
1. Navigate to the `browser-script` directory
2. Run the build script:
   ```bash
   node build-script.js
   ```
3. The script will generate `zevent-place-overlay.user.js` with all modules combined

### Build Script Features
- Combines files in the correct dependency order
- Adds section separators for easy debugging
- Validates that all source files exist
- Reports final file size
- Overwrites the existing userscript file

## Development Workflow

1. **Edit source files** in the `src/` directory
2. **Run build script** to generate the combined userscript
3. **Install/Update** the generated `.user.js` file in Tampermonkey
4. **Test** the functionality on https://place.zevent.fr/

## File Dependencies

The build script combines files in this order to ensure proper dependency resolution:

1. `meta.js` - Must be first (Tampermonkey metadata)
2. `constants.js` - Global variables used by other modules
3. `utils.js` - Utility functions used by other modules
4. `overlay-manager.js` - Core functionality
5. `ui-components.js` - UI functions that depend on overlay manager
6. `event-handlers.js` - Event handlers that use UI and overlay functions
7. `network.js` - Network functions that use utilities and UI
8. `styles.js` - CSS styling
9. `main.js` - Main execution logic (must be last)

## Benefits of Modular Structure

- **Maintainability**: Easier to locate and edit specific functionality
- **Readability**: Smaller, focused files are easier to understand
- **Collaboration**: Multiple developers can work on different modules
- **Testing**: Individual modules can be tested separately
- **Debugging**: Clear section separators in the built file help with debugging

## Original Functionality

The modular version maintains 100% compatibility with the original monolithic userscript, including:
- Overlay loading and management
- UI for overlay selection
- Network fetching of overlay lists
- Version checking
- All keyboard shortcuts and interactions
