// Case-insensitive sorting
const caseInsensitiveSort = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { sensitivity: "base" });

export const sort = {
  caseInsensitiveSort,
};
