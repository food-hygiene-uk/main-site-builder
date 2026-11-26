"use strict";
{
  /**
  Determine the user's preferred color scheme
  Site settings take priority over browser settings.
  */
  const colorSchemeMQL = globalThis?.matchMedia?.(
    "(prefers-color-scheme:dark)",
  );

  /**
  Updates the color scheme of the document based on site and browser settings.
  */
  const updateColorScheme = () => {
    const setting = localStorage.getItem("color-scheme");
    const prefers = colorSchemeMQL?.matches ? "dark" : "light";

    document.documentElement.dataset.colorScheme = setting ?? prefers;
  };

  colorSchemeMQL?.addEventListener("change", () => {
    updateColorScheme();
  });

  updateColorScheme();

  /**
  Determine the user's preferred motion setting
  Site settings take priority over browser settings.
  */
  const motionMQL = globalThis?.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  );

  /**
  Updates the motion setting of the document based on site and browser settings.
  */
  const updateMotionPreference = () => {
    const setting = localStorage.getItem("motion-preference");
    const prefers = motionMQL?.matches ? "reduce" : "no-preference";

    document.documentElement.dataset.motionPreference = setting ?? prefers;
  };

  motionMQL?.addEventListener("change", () => {
    updateMotionPreference();
  });

  updateMotionPreference();
}
