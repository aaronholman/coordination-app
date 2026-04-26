export function formatEnumLabel(value: string): string {
  const normalized = value.replace(/_/g, " ");
  if (!normalized) {
    return normalized;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Converts stored rich text content (BlockNote JSON, markdown, HTML, or plain text)
 * into a clean plain-text preview string for use in cards, tables, and list views.
 *
 * Use this function anywhere stored rich text content needs to be displayed outside
 * of the BlockNote editor — in cards, table cells, preview text, summaries, tooltips, etc.
 */
export function getPlainTextPreview(content: string | null | undefined, maxLength = 120): string {
  if (!content || content.trim() === "") {
    return "";
  }

  const trimmedContent = content.trim();
  let plainText = "";

  // Check if it's BlockNote JSON format
  if (trimmedContent.startsWith("[") && trimmedContent.endsWith("]")) {
    try {
      const blocks = JSON.parse(trimmedContent);
      if (Array.isArray(blocks)) {
        plainText = blocks
          .map((block: any) => {
            if (block?.content) {
              // Handle paragraph, heading blocks with content array
              if (Array.isArray(block.content)) {
                return block.content
                  .map((contentItem: any) => {
                    if (typeof contentItem === "string") {
                      return contentItem;
                    }
                    if (contentItem?.text) {
                      return contentItem.text;
                    }
                    return "";
                  })
                  .join("");
              }
              // Handle blocks with direct string content
              if (typeof block.content === "string") {
                return block.content;
              }
            }
            // Handle list items and other block types
            if (block?.text) {
              return block.text;
            }
            return "";
          })
          .filter((text: string) => text.length > 0)
          .join(" ");
      }
    } catch {
      // If JSON parsing fails, treat as regular text
      plainText = trimmedContent;
    }
  } else {
    plainText = trimmedContent;
  }

  // Strip markdown formatting
  plainText = plainText
    .replace(/^#+\s+/gm, "") // Headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1") // Italic
    .replace(/`(.*?)`/g, "$1") // Inline code
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
    .replace(/^[-*+]\s+/gm, "") // List items
    .replace(/^\d+\.\s+/gm, ""); // Numbered list items

  // Strip HTML tags
  plainText = plainText.replace(/<[^>]*>/g, "");

  // Normalize whitespace
  plainText = plainText.replace(/\s+/g, " ").trim();

  // Truncate if necessary
  if (plainText.length > maxLength) {
    plainText = plainText.substring(0, maxLength).trim() + "...";
  }

  return plainText;
}
