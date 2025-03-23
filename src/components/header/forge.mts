import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { getClassSuffix } from "../../lib/template/template.mts";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./header.vto"),
);
const template = await env.load(pageTemplatePath);

// Read the file using the absolute path
const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);

export const forgeHeader = async () => {
  const classSuffix = getClassSuffix();
  const processedCss = cssContent.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const css = processedCss;

  const html = await template({
    classSuffix,
  });

  return {
    css,
    html: html.content,
  };
};
