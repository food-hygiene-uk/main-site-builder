/**
 * Gets a required DOM element and verifies its type.
 *
 * @template {Element} T
 * @param {string} selector - The CSS selector for the element
 * @param {new (...args: never[]) => T} elementType - The expected constructor of the element type
 * @param {ParentNode} [root] - The root in which to search
 * @throws {TypeError} If the element is not found or is of the wrong type
 * @returns {T} The DOM element of the specified type
 */
export const getReference = (selector, elementType, root = document) => {
  const element = root.querySelector(selector);
  if (!(element instanceof elementType)) {
    throw new TypeError(`Reference ${selector} not found in DOM`);
  }
  return element;
};
