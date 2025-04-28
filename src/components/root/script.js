"use strict";
{
  const updateColorScheme = (mql) => {
    const prefers = mql?.matches ? "dark" : "light";
    const setting = localStorage.getItem("color-scheme");

    document.documentElement.dataset.colorScheme = setting ?? prefers;
  };
  const colorSchemeMQL = globalThis?.matchMedia?.(
    "(prefers-color-scheme:dark)",
  );
  colorSchemeMQL.addEventListener("change", function (event) {
    updateColorScheme(event);
  });

  updateColorScheme(colorSchemeMQL);
}
