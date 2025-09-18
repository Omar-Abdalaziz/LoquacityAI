

import { ComparisonTableData } from '../types';

/**
 * Parses a single Markdown table row into an array of cell strings.
 * @param rowString The string for a single row.
 * @returns An array of strings, where each is the content of a cell.
 */
const parseRow = (rowString: string): string[] => {
  if (typeof rowString !== 'string') return [];
  const cleanedRow = rowString.trim().replace(/^\||\|$/g, '').trim();
  return cleanedRow.split('|').map(cell => cell.trim());
};

/**
 * Checks if a line is a valid Markdown table separator.
 * @param line The line to check.
 * @returns True if the line is a valid separator.
 */
const isSeparatorLine = (line: string): boolean => {
  if (typeof line !== 'string') return false;
  const trimmedLine = line.trim();
  if (!trimmedLine.includes('-') || !trimmedLine.includes('|')) {
    return false;
  }
  const segments = trimmedLine.replace(/^\||\|$/g, '').split('|');
  return segments.length > 0 && segments.every(s => /^\s*:?-+:?\s*$/.test(s));
};

/**
 * The internal implementation to extract a Markdown table from a string.
 */
const _internalParseMarkdownForTable = (markdown: string): { remainingText: string; table: ComparisonTableData | null } => {
  const lines = markdown.split('\n');
  let tableStartIndex = -1;
  let tableEndIndex = -1;
  let headers: string[] = [];
  const rowsData: string[][] = [];

  for (let i = 0; i < lines.length - 1; i++) {
    const potentialHeaderLine = lines[i];
    const potentialSeparatorLine = lines[i + 1];

    if (isSeparatorLine(potentialSeparatorLine)) {
      const potentialHeaders = parseRow(potentialHeaderLine);
      const separatorCols = potentialSeparatorLine.replace(/^\s*\||\|\s*$/g, '').split('|');

      if (potentialHeaders.length > 0 && potentialHeaders.length === separatorCols.length) {
        headers = potentialHeaders;
        tableStartIndex = i;
        tableEndIndex = i + 1;

        for (let j = i + 2; j < lines.length; j++) {
          const rowLine = lines[j];
          if (!rowLine.includes('|')) {
            break;
          }
          const row = parseRow(rowLine);
          if (row.length !== headers.length) {
            break;
          }
          rowsData.push(row);
          tableEndIndex = j;
        }
        break;
      }
    }
  }

  if (tableStartIndex === -1 || rowsData.length === 0) {
    return { remainingText: markdown, table: null };
  }

  const remainingLines = lines.filter((_, index) => index < tableStartIndex || index > tableEndIndex);
  const remainingText = remainingLines.join('\n').trim();

  return {
    remainingText,
    table: { headers, rows: rowsData },
  };
};

/**
 * Parses a response string that may contain a JSON block for a comparison table,
 * or a standard Markdown table.
 * 
 * It prioritizes finding a ````json` block with a `table` key. If found, it extracts
 * the table data and combines any text from inside and outside the JSON block.
 * 
 * If no valid JSON block is found, or if it's malformed, it falls back to parsing 
 * the entire response for a standard Markdown table.
 *
 * @param responseText The full response string from the AI.
 * @returns An object with `remainingText` (the main text content) and `table` (parsed table data, or null).
 */
export const extractAndParseMarkdownTable = (responseText: string): { remainingText: string; table: ComparisonTableData | null } => {
  if (!responseText || typeof responseText !== 'string') {
    return { remainingText: responseText || '', table: null };
  }

  const textToParse = responseText.trim();
  
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const blockMatch = textToParse.match(jsonBlockRegex);
  
  if (blockMatch && blockMatch[0] && blockMatch[1]) {
    const jsonString = blockMatch[1];
    try {
      const parsedJson = JSON.parse(jsonString);

      if (parsedJson && parsedJson.table) {
        const table = (
          typeof parsedJson.table === 'object' &&
          parsedJson.table !== null &&
          Array.isArray(parsedJson.table.headers) &&
          Array.isArray(parsedJson.table.rows)
        ) ? parsedJson.table as ComparisonTableData : null;

        if (table) {
          // Successfully parsed a table from the JSON block.
          // Now, construct the final text content.
          const textOutsideBlock = textToParse.replace(blockMatch[0], '').trim();
          const textInsideBlock = (typeof parsedJson.text === 'string') ? parsedJson.text.trim() : '';
          
          // Join the text from outside and inside the JSON block.
          const combinedText = [textOutsideBlock, textInsideBlock].filter(Boolean).join('\n\n');
          
          return {
            remainingText: combinedText,
            table: table,
          };
        }
      }
    } catch (e) {
      // The JSON block was found but was malformed.
      // We will fall through and let the markdown parser try to find a table
      // in the text outside the corrupted JSON block.
      const textOutsideBlock = textToParse.replace(blockMatch[0], '').trim();
      const result = _internalParseMarkdownForTable(textOutsideBlock);
      // If a markdown table is found outside the bad JSON, use it.
      if (result.table) {
          return result;
      }
      // Otherwise, we continue to the final fallback.
    }
  }

  // Final fallback: Parse the entire original text for a Markdown table.
  // This handles cases with no JSON block, or a bad JSON block with no valid markdown table outside of it.
  return _internalParseMarkdownForTable(responseText);
};