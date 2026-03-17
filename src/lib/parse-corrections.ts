/**
 * Parses AI response text to extract structured correction/suggestion data.
 * Returns cleaned content (without markers) plus extracted corrections/suggestions.
 */

export interface ParsedMessage {
  content: string;
  correction: string | null;
  suggestion: string | null;
}

export function parseCorrections(rawContent: string): ParsedMessage {
  let content = rawContent;
  let correction: string | null = null;
  let suggestion: string | null = null;

  // Extract all corrections
  const correctionRegex = /<<<CORRECTION>>>([\s\S]*?)<<<END_CORRECTION>>>/g;
  const corrections: string[] = [];
  let match;
  while ((match = correctionRegex.exec(content)) !== null) {
    corrections.push(match[1].trim());
  }
  if (corrections.length > 0) {
    correction = corrections.join('\n');
  }

  // Extract all suggestions
  const suggestionRegex = /<<<SUGGESTION>>>([\s\S]*?)<<<END_SUGGESTION>>>/g;
  const suggestions: string[] = [];
  while ((match = suggestionRegex.exec(content)) !== null) {
    suggestions.push(match[1].trim());
  }
  if (suggestions.length > 0) {
    suggestion = suggestions.join('\n');
  }

  // Remove markers from display content
  content = content
    .replace(/<<<CORRECTION>>>[\s\S]*?<<<END_CORRECTION>>>/g, '')
    .replace(/<<<SUGGESTION>>>[\s\S]*?<<<END_SUGGESTION>>>/g, '')
    .trim();

  return { content, correction, suggestion };
}
