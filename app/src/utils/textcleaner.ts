/**
 * Clean AI-generated text by removing markdown headers and formatting
 * @param text - The raw text to clean
 * @returns Cleaned text
 */
export default function cleanAiText(text: string): string {
    if (!text) return '';

    return text
        // Remove "# Top X Learnings" headers
        .replace(/^#\s*Top\s+\d+\s+Learnings?\s*$/gim, '')
        // Remove ### headers (but keep the content after them)
        .replace(/^###\s+\d+\.\s*/gm, '')
        // Remove any remaining ### headers
        .replace(/^###\s+/gm, '')
        // Remove #### headers
        .replace(/^####\s+/gm, '')
        // Remove ##### headers
        .replace(/^#####\s+/gm, '')
        // Remove any standalone # headers
        .replace(/^#+\s*/gm, '')
        // Clean up multiple consecutive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Remove leading/trailing whitespace
        .trim();
}
