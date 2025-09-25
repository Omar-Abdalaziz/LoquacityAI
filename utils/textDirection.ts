/**
 * Determines the text direction ('rtl' or 'ltr') of a given string
 * by checking for the presence of Arabic characters.
 * @param text The string to analyze.
 * @returns 'rtl' if Arabic characters are found, otherwise 'ltr'.
 */
export const getTextDirection = (text: string): 'rtl' | 'ltr' => {
  if (!text) return 'ltr';
  // This regex checks for characters in the Arabic Unicode block.
  const rtlRegex = /[\u0600-\u06FF]/;
  return rtlRegex.test(text) ? 'rtl' : 'ltr';
};
