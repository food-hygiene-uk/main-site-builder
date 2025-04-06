import { fromFileUrl } from "@std/path";
import vento from "@vento/vento";
import autoTrim from "@vento/vento/plugins/auto_trim.ts";
import { getClassSuffix } from "../../lib/template/template.mts";
import postcss from "postcss";
import cssnano from "cssnano";

const env = vento();
env.use(autoTrim());
env.cache.clear();

const pageTemplatePath = fromFileUrl(
  import.meta.resolve("./footer.vto"),
);
const template = await env.load(pageTemplatePath);

// Read the file using the absolute path
const cssPath = fromFileUrl(
  import.meta.resolve("./styles.css"),
);
const cssContent = Deno.readTextFileSync(cssPath);
const processedCss = await postcss([cssnano]).process(cssContent, {
  from: undefined,
});

export const forgeFooter = async () => {
  const classSuffix = getClassSuffix();
  const css = processedCss.css.replace(/__CLASS_SUFFIX__/g, classSuffix);

  const html = (await template({
    classSuffix,
  })).content;

  return {
    css,
    html,
  };
};
