/**
 * Converts a text string to a URL-friendly slug
 * Removes special characters, converts spaces to hyphens, and makes lowercase
 *
 * @param {string} text - The text to convert to a slug
 * @returns {string} A URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
};
