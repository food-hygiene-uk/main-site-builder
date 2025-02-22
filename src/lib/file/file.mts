// Based on https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap03.html#tag_03_282
// Uppercase is remmoved since we lowercase the string before replacing characters.
// The "_" is removed since "-" is more performant in URLs regarding SEO.
// The "." is removed since these strings should not have extensions.
const replacedCharactersRegex = /[^a-z0-9-]/g;

const reservedNames = [
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
];

// Accepts a string and returns a string that is a valid name part of a filename.
export const encodeName = (string: string) => {
  const filename = string.toLowerCase().replace(replacedCharactersRegex, "-");

  if (reservedNames.includes(filename)) {
    throw new Error(`Filename "${filename}" is disallowed.`);
  }

  return filename;
};
