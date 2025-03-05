export const slugify = (text: string) => {
  return text.toLowerCase()
    .replace(/\s/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
};
