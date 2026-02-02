const suffixPoolIndexes = new Map();

/**
 * Gets a hash of the caller's filename for consistent class suffix generation
 *
 * @returns A hash string derived from the caller's filename
 */
const getCallerFilenameHash = (): string => {
  const error = new Error("generate stack trace");
  const stack = (error.stack ?? "").split("\n");
  const callerLine = stack[3]; // 0: Error, 1: getCallerFilenameHash, 2: getClassSuffix, 3: caller

  // Extract filename from the caller line (format may vary)
  const filenameMatch = callerLine.match(/^.*(\/src\/(.*?)\.mts)/);
  if (filenameMatch && filenameMatch[1]) {
    const filename = filenameMatch[1];

    // Generate a simple hash for non-security purposes
    let hash = 0;
    for (let index = 0; index < filename.length; index++) {
      hash = (hash << 5) - hash + filename.codePointAt(index)!;
      hash = Math.trunc(hash); // Convert to 32bit integer
    }

    // Convert the hash to a 7 character string
    const stringHash = Math.abs(hash).toString(36).slice(0, 7);

    return stringHash;
  } else {
    console.warn("Could not extract filename from stack trace.");

    return "";
  }
};

const suffixPool = [
  "cd4ue",
  "ywuw5j",
  "145qa",
  "cq1k6e",
  "9sv7z1",
  "ek6bid",
  "y16cp8",
  "6h83",
  "zw7yvf",
  "u5ok3",
  "hzdfws",
  "jj2h2",
  "fcgohl",
  "97mkn",
  "ucae4d",
  "2809h",
  "lfdt5o",
  "otmkn8",
  "cex67z",
  "q4gjvd",
  "b5jnft",
  "z44q",
  "bwf3u",
  "0qm3lk",
  "mhokwq",
  "jnqlexd",
  "qo5t3j",
  "a415k",
  "8fpz1b",
  "stayh",
  "95cipf",
  "pdum9a",
  "sym6ln",
  "67y4m6",
  "maxa0a",
  "bm1bdvu",
  "caeyec",
  "s185wj",
  "fptg0k",
  "xy742",
  "k3nm4l",
  "zjtxl",
  "d6ep4e",
  "nemz7g",
  "otqcdo",
  "66797",
  "mo3qvw",
  "qc3xkd",
  "jg0xn",
  "unlqm",
  "4b6uo",
  "8imvf",
  "lyog4",
  "rqk37f",
  "h3ad34",
  "zkad4m",
  "nbon9e",
  "4ajue9",
  "p8gbj",
  "odugi8",
  "ppqttc",
  "wqlrx",
  "4h060a",
  "fm2ez",
  "7x9qyh",
  "ct9pje",
  "3wvls7",
  "buzt5",
  "dmwktu",
  "vg7ow",
  "xsyckb",
  "3by34v",
  "e4cpda",
  "ld28jc",
  "wbxgz",
  "qo9tve",
  "eg3kxe",
  "b6bcpm",
  "5bkjtt",
  "lhckns",
  "ntl4eo",
  "nntj4f",
  "vd2a9b",
  "d9xus",
  "25mdb",
  "5satqd",
  "537m8v",
  "yj85mh",
  "ybd4rx",
  "j5z4rv",
  "flyzk",
  "hxvahn",
  "bo1sdt",
  "ea969k",
  "qpdbi8",
  "sucd9i",
  "ct9m2i",
  "6c0tbc",
  "xgvp1f",
  "g5o6zh",
];

/**
 * Returns a string to be used as a class suffix.
 *
 * This mimics CSS Modules unique class hashes,
 * but is designed to work with static websites.
 *
 * If the HTML and build order remains the same, then
 * the class suffix will remain consistent between builds.
 *
 * There is a pool of suffixes that will be rotated between.
 *
 * If the class is for a single instance component, then the classSuffix does not need to be distinct.
 *
 * @param singleInstance - Whether the component is a single instance component.
 * @returns A random string of characters.
 */
export const getClassSuffix = (singleInstance: boolean): string => {
  const singleInstanceComponent = Boolean(singleInstance);

  const callerHash = getCallerFilenameHash();

  const seedFromHash = Number.parseInt(callerHash.slice(0, 8), 36);
  const index =
    (singleInstanceComponent
      ? seedFromHash
      : suffixPoolIndexes.get(callerHash) || seedFromHash) % suffixPool.length;
  const suffix = suffixPool[index];

  if (singleInstanceComponent == false) {
    suffixPoolIndexes.set(callerHash, index + 1);
  }

  return suffix;
};
