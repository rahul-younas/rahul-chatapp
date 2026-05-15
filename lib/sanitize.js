import DOMPurify from "isomorphic-dompurify";

export function sanitizeInput(input, maxLength = 500) {
  const trimmed = input.trim().slice(0, maxLength);
  return DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
}
