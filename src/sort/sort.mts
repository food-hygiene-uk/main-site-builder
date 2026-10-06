// Case-insensitive sorting
const caseInsensitiveSort = (a: string, b: string): number => {
  const baseComparison = a.localeCompare(b, undefined, { sensitivity: "base" });

  return baseComparison === 0 ? a.localeCompare(b) : baseComparison;
};

export const sort = {
  caseInsensitiveSort,
};
