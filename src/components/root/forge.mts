import { fromFileUrl } from "@std/path";
import { getClassSuffix } from "../../lib/template/template.mts";

// Read the file using the absolute path
const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

const jsPath = fromFileUrl(
  import.meta.resolve("./script.js"),
);
const jsContent = Deno.readTextFileSync(jsPath);

export const forgeRoot = () => {
  const classSuffix = getClassSuffix();
  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const css = processedCss;

  const processedJs = jsContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const html = ``;

  const renderHead = (
    { canonical, title, pageCSS, headerCSS, footerCSS }: {
      canonical: string;
      title: string | undefined;
      pageCSS: string;
      headerCSS: string;
      footerCSS: string;
    },
  ) => {
    const fullTitle = [title, "Food Hygiene Ratings UK"].filter(Boolean).join(
      " - ",
    );

    return `
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${fullTitle}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="canonical" href="${canonical}" />
    <script>
      ${processedJs}
    </script>
    <style>
        ${css}
        ${pageCSS}
        ${headerCSS}
        ${footerCSS}
    </style>
  </head>
    `;
  };

  return {
    css,
    html,
    renderHead,
  };
};
