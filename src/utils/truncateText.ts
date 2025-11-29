export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Cut the string to maxLength
  let truncated = text.slice(0, maxLength);

  // Ensure we don't cut off a word
  const lastSpaceIndex = truncated.lastIndexOf(" ");
  if (lastSpaceIndex > 0) {
    truncated = truncated.slice(0, lastSpaceIndex);
  }

  return truncated + "...";
}
