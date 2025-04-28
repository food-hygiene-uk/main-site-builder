/**
 * Runs a function that returns a promise on an array of items with a maximum number of concurrent requests.
 *
 * @template T - The type of the items in the array.
 * @template R - The type of the result returned by the function.
 * @param items - The array of items to process.
 * @param maxConcurrent - The maximum number of concurrent requests.
 * @param function_ - The function to run on each item, which returns a promise.
 * @returns A promise that resolves to an array of results.
 */
export function mapConcurrent<T, R>(
  items: T[],
  maxConcurrent: number,
  function_: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  let index = 0;
  let inFlightCntr = 0;
  let doneCntr = 0;
  const results = Array.from({ length: items.length }) satisfies R[];
  let stop = false;

  return new Promise(function (resolve, reject) {
    /**
     * Executes the next function in the queue, updating the in-flight counter and handling results or errors.
     */
    function runNext() {
      const index_ = index;
      ++inFlightCntr;
      function_(items[index], index += 1)
        .then(function (value) {
          ++doneCntr;
          --inFlightCntr;
          results[index_] = value;
          run();

          return;
        })
        .catch(function (error) {
          // set flag so we don't launch any more requests
          stop = true;
          reject(error);
        });
    }

    /**
     * Manages the execution of the function on items, ensuring the maximum concurrency limit is respected.
     */
    function run(): void {
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
