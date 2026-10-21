"use strict";
{
  const colorSchemeMQL = globalThis?.matchMedia?.(
    "(prefers-color-scheme:dark)",
  );

  /**
  Updates the color scheme of the document based on user preference and system settings.
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
}
