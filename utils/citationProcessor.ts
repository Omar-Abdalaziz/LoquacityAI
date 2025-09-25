import { Citation, Source } from '../types';

/**
 * Injects HTML citation links into a text string based on metadata provided by the Gemini API.
 * This function processes citations by inserting styled `<sup>` tags with interactive `<button>` elements
 * that can trigger popovers.
 *
 * @param content The original text content from the AI.
 * @param citations An array of citation metadata objects. Can be null or undefined.
 * @param sources An array of source objects. Can be null or undefined.
 * @returns A new string with HTML for citation buttons injected for each valid citation,
 * or the original content if no valid citations can be processed.
 */
export const processCitedContent = (
  content: string,
  citations: Citation[] | null | undefined,
  sources: Source[] | null | undefined
): string => {
  // If there are no citations or sources, there's nothing to process.
  if (!citations || citations.length === 0 || !sources || sources.length === 0) {
    return content;
  }

  // Create a map for quick lookup of a source's index and title by its URI.
  // This is more efficient than searching the sources array for each citation.
  const uriToSourceData = new Map(
    sources.map((source, index) => [
      source.uri,
      { index, title: source.title },
    ])
  );

  // 1. Filter out citations that don't have a matching source in our list.
  // 2. Add the source index and title directly to the citation object for easy access.
  // 3. Sort by start index in ascending order to process the string from left to right.
  const processedCitations = citations
    .filter((c): c is Citation & { startIndex: number } => typeof c.startIndex === 'number')
    .map(citation => {
      const sourceData = uriToSourceData.get(citation.uri);
      if (!sourceData) return null; // This citation's source isn't in the provided list.
      return {
        ...citation,
        sourceIndex: sourceData.index,
        sourceTitle: sourceData.title,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.startIndex - b.startIndex);

  // If no citations are left after filtering, return the original content.
  if (processedCitations.length === 0) {
    return content;
  }
  
  // We build the new string by collecting pieces into an array, which is more
  // performant than repeated string concatenation.
  const resultParts: string[] = [];
  let lastIndex = 0;

  for (const citation of processedCitations) {
    // The API provides `endIndex` to mark the end of the text segment being cited.
    // We use this as the point to insert our citation link.
    const insertionPoint = citation.endIndex || citation.startIndex;
    
    // This condition handles potential overlapping citations by skipping inner ones.
    // We ensure we're always moving forward through the string.
    if (insertionPoint < lastIndex) {
      continue;
    }
    
    // Add the text segment from the end of the last processed part up to this citation's insertion point.
    resultParts.push(content.substring(lastIndex, insertionPoint));
    
    // Create a Markdown link for the citation. This will be handled by a custom renderer.
    const citationNumber = citation.sourceIndex + 1;
    const citationMarkdownLink = `[${citationNumber}](#citation-${citation.sourceIndex})`;
    resultParts.push(citationMarkdownLink);

    // Update our position in the original string.
    lastIndex = insertionPoint;
  }

  // Add any remaining text from the original string after the last citation.
  resultParts.push(content.substring(lastIndex));

  return resultParts.join('');
};
