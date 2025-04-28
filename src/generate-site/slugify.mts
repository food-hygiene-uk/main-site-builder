/**
 * Converts a text string to a URL-friendly slug
 * Removes special characters, converts spaces to hyphens, and makes lowercase
 *
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replaceAll(/\s/g, "-")
    .replaceAll(/[^a-z0-9-]/g, "")
    .replaceAll(/--+/g, "-")
    .replaceAll(/^-|-$/g, "");
};
