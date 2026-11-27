/**
@typedef {{ idleTimer: number | undefined }} EyeTrackingState
*/

/**
Shared helper to reset coordinates and activate CSS keyframes

@param {SVGSVGElement} svg - SVG Element
@param {EyeTrackingState} state - mascot state
*/
const enterIdle = (svg, state) => {
  clearTimeout(state.idleTimer);
  svg.classList.remove("active");
};

/**
Enhances the homepage so that the mascot's eyes track the mouse pointer.

@param {SVGSVGElement} svg - The SVG element to process
@param {number} [idleDelay] - milliseconds after last pointer movement to become idle again
*/
function initEyeTracking(svg, idleDelay = 4000) {
  if (!svg) return;

  /**
  @type {EyeTrackingState}
  */
  const state = {
    idleTimer: undefined,
  };

  // Configure each part with its own max movement (in SVG units) and reach radius
  const PART_CONFIG = [
    { id: "eye-left-pupil", maxOffset: 22, reach: 450 },
    { id: "eye-left-shine-1", maxOffset: 26, reach: 450 },
    { id: "eye-left-shine-2", maxOffset: 14, reach: 450 },
    { id: "eye-right-pupil", maxOffset: 22, reach: 450 },
    { id: "eye-right-shine-1", maxOffset: 26, reach: 450 },
    { id: "eye-right-shine-2", maxOffset: 14, reach: 450 },
    { id: "eyebrow-left", maxOffset: 12, reach: 500 },
    { id: "eyebrow-right", maxOffset: 12, reach: 500 },
  ];

  // Cache elements and calculate their true centers in SVG space once
  const parts = PART_CONFIG.flatMap((config) => {
    const element = svg.querySelector(`#${config.id}`);
    if (!(element instanceof SVGGraphicsElement)) return [];

    const bbox = element.getBBox();
    // Pass the relative depth scale to CSS so idle keyframes preserve parallax
    element.style.setProperty("--parallax", (config.maxOffset / 26).toFixed(2));

    return {
      el: element,
      cx: bbox.x + bbox.width / 2,
      cy: bbox.y + bbox.height / 2,
      maxOffset: config.maxOffset,
      reach: config.reach,
    };
  });

  if (parts.length === 0) return;

  // Start in idle mode immediately
  enterIdle(svg, state);

  const pt = svg.createSVGPoint();

  addEventListener(
    "pointermove",
    (event_) => {
      svg.classList.add("active");
      clearTimeout(state.idleTimer);
      state.idleTimer = setTimeout(enterIdle, idleDelay, svg, state);

      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      // Convert screen pointer coordinates directly into SVG viewBox coordinates
      pt.x = event_.clientX;
      pt.y = event_.clientY;
      const cursor = pt.matrixTransform(ctm.inverse());

      for (const part of parts) {
        const dx = cursor.x - part.cx;
        const dy = cursor.y - part.cy;
        const distance = Math.hypot(dx, dy);

        // Simplified proportional clamping: scales smoothly up to maxOffset
        const factor = distance > 0
          ? Math.min(distance, part.reach) / part.reach
          : 0;
        const angle = Math.atan2(dy, dx);

        const offsetX = Math.cos(angle) * part.maxOffset * factor;
        const offsetY = Math.sin(angle) * part.maxOffset * factor;

        part.el.style.setProperty("--look-x", `${offsetX.toFixed(2)}px`);
        part.el.style.setProperty("--look-y", `${offsetY.toFixed(2)}px`);
      }
    },
    { passive: true },
  );

  document.documentElement.addEventListener("pointerleave", () => {
    clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(enterIdle, idleDelay / 2, svg, state);
  });
}

/**
Loads the interactive version of the mascot
*/
async function loadInteractiveMascot() {
  const img = document.querySelector("img[data-interactive-mascot]");
  if (!(img instanceof HTMLImageElement)) return;

  try {
    const response = await fetch(img.src);

    if (!response.ok) throw new Error("Failed to load SVG");
    const svgText = await response.text();

    const domDocument = new DOMParser().parseFromString(
      svgText,
      "image/svg+xml",
    );
    const svg = domDocument.querySelector("svg");
    if (!svg) {
      throw new Error("No SVG found.");
    }
    const width = Number(svg.getAttribute("width"));
    const height = Number(svg.getAttribute("height"));
    const hasViewBox = svg.hasAttribute("viewBox");

    if (width && height && !hasViewBox) {
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.removeAttribute("width");
      svg.removeAttribute("height");
    } else {
      console.error("Mascot does not match expectation.", {
        width,
        height,
        hasViewBox,
      });
      return;
    }

    svg.dataset.interactiveMascot = "";
    if (img.className) svg.setAttribute("class", img.className);
    if (img.alt) {
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", img.alt);
    }

    // Adopt the node into the current document cleanly
    const importedSvg = document.importNode(svg, true);
    img.replaceWith(importedSvg);

    // Wait one animation frame so the browser computes SVG layout & bounding boxes
    requestAnimationFrame(() => {
      initEyeTracking(importedSvg);
    });
  } catch (error) {
    console.warn("Something went wrong. Page not enhanced.", error);
  }
}

await loadInteractiveMascot();
