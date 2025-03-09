"use strict";
{
  const updateColorScheme = (mql) => {
    const prefers = mql?.matches ? "dark" : "light";
    const setting = localStorage.getItem("color-scheme");

    document.documentElement.setAttribute(
      "data-color-scheme",
      setting ?? prefers,
    );
  };
  const colorSchemeMQL = globalThis?.matchMedia?.(
    "(prefers-color-scheme:dark)",
  );
  colorSchemeMQL.addEventListener("change", function (e) {
    updateColorScheme(e);
  });

  updateColorScheme(colorSchemeMQL);
}
