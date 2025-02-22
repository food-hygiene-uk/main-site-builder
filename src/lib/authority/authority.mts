import { Authority } from "../../ratings-api/types.ts";
import { config } from "../config/config.ts";
import { encodeName } from "../file/file.mts";

export const getHtmlFilename = (authority: Authority) => {
  return `${getLinkURL(authority)}.html`;
};

export const getCanonicalLinkURL = (authority: Authority) => {
  return `${config.BASE_URL}${getLinkURL(authority)}`;
};

export const getLinkURL = (authority: Authority) => {
  return `/l/${getLinkName(authority)}`;
};

export const getLinkName = (authority: Authority) => {
  const safeName = globalThis.encodeURI(encodeName(authority.FriendlyName));

  return safeName;
};
