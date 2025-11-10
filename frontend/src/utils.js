/**
 * Utility functions for the application
 */

/**
 * Creates a page URL by converting page name to lowercase route
 * @param {string} pageName - The page name (e.g., "Home", "Feed")
 * @returns {string} - The URL path (e.g., "/home", "/feed")
 */
export function createPageUrl(pageName) {
  return `/${pageName.toLowerCase()}`;
}
