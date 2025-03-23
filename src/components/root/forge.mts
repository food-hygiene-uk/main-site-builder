import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { getClassSuffix } from "../../lib/template/template.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./root.vto"),
);
const template = await env.load(pageTemplatePath);

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

  const renderHead = async (
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

    return (await template({
      canonical,
      css,
      footerCSS,
      fullTitle,
      headerCSS,
      pageCSS,
      processedJs,
    })).content;
  };

  return {
    css,
    html,
    renderHead,
  };
};
