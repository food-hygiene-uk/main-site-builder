/**
 * Runs a function that returns a promise on an array of items with a maximum number of concurrent requests.
 *
 * @template T - The type of the items in the array.
 * @template R - The type of the result returned by the function.
 * @param {Array<T>} items - The array of items to process.
 * @param {number} maxConcurrent - The maximum number of concurrent requests.
 * @param {function(T, number): Promise<R>} fn - The function to run on each item, which returns a promise.
 * @returns {Promise<Array<R>>} A promise that resolves to an array of results.
 */
export function mapConcurrent<T, R>(
  items: T[],
  maxConcurrent: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  let index = 0;
  let inFlightCntr = 0;
  let doneCntr = 0;
  const results = new Array<R>(items.length);
  let stop = false;

  return new Promise(function (resolve, reject) {
    function runNext() {
      const i = index;
      ++inFlightCntr;
      fn(items[index], index += 1).then(
        function (val) {
          ++doneCntr;
          --inFlightCntr;
          results[i] = val;
          run();
        },
        function (err) {
          // set flag so we don't launch any more requests
          stop = true;
          reject(err);
        },
      );
    }

    function run() {
      // launch as many as we're allowed to
      while (!stop && inFlightCntr < maxConcurrent && index < items.length) {
        runNext();
      }
      // if all are done, then resolve parent promise with results
      if (doneCntr === items.length) {
        resolve(results);
      }
    }

    run();
  });
}
