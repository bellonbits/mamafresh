// MamaFresh AI is meant to read like a warm text message from a real person,
// not a rendered markdown document — the chat UI has no markdown renderer, so
// any raw **bold**, ## headers, or --- rules would otherwise show up as ugly
// literal punctuation. This strips common markdown syntax defensively, in
// case the model uses it despite being told not to in the system prompt.
export function toPlainChatText(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[=\-]{3,}\s*$/gm, "")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^[ \t]*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
