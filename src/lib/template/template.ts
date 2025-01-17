const generatedSuffixes = new Set<string>();

/**
 * Generates a random string to be used as a class suffix.
 * Keeps a history of every returned value and never returns a duplicate.
 *
 * @returns {string} A random string of characters.
 */
export const getClassSuffix = (): string => {
  let random: string;
  do {
    random = Math.random().toString(36).substring(7);
  } while (generatedSuffixes.has(random));

  generatedSuffixes.add(random);

  return random;
};
