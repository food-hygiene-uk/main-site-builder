/**
@typedef {typeof SUPPORTED_LANGUAGES[number]} SupportedLanguage
*/

/**
@type {readonly ["en", "cy"]}
*/
const SUPPORTED_LANGUAGES = ["en", "cy"];

/**
@type {SupportedLanguage}
*/
const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];

/**
Checks whether a value is one of the supported languages.

@param {string} language The language to check
@returns {language is SupportedLanguage} Whether the language is supported
*/
const isSupportedLanguage = (language) =>
  /** @type {readonly string[]} */ (SUPPORTED_LANGUAGES).includes(language);

/**
Resolves the user's preferred language.

@returns {SupportedLanguage} The resolved language
*/
const resolveLanguage = () => {
  const STORAGE_KEY = "language";

  const siteLang = localStorage.getItem(STORAGE_KEY);
  if (siteLang && isSupportedLanguage(siteLang)) {
    return siteLang;
  }

  const userLangs = navigator.languages ?? [];
  const browserLang = navigator.language ? [navigator.language] : [];

  const combinedCandidates = new Set([...userLangs, ...browserLang]);

  for (const lang of combinedCandidates) {
    try {
      const baseLang = new Intl.Locale(lang).language.toLowerCase();
      if (isSupportedLanguage(baseLang)) {
        return baseLang;
      }
    } catch {
      const fallbackSplit = lang.split("-", 1)[0].toLowerCase();
      if (isSupportedLanguage(fallbackSplit)) {
        return fallbackSplit;
      }
    }
  }

  return DEFAULT_LANGUAGE;
};

/**
Caches the extracted language for consistent use across the application. This
ensures that the language is determined once and reused.
*/
export const LANGUAGE = resolveLanguage();
