/**
 * Extracts the body content from a full HTML email document
 * This prevents full HTML documents from breaking the page when rendered
 *
 * @param htmlEmail - Full HTML email string with <html>, <head>, <body> tags
 * @returns Only the inner content of the <body> tag, or the original string if no body tag found
 */
export function extractEmailBodyContent(htmlEmail: string): string {
  if (!htmlEmail) {
    return ''
  }

  // Match the body tag and extract its inner content
  // This regex handles both <body> and <body ...attributes>
  const bodyMatch = htmlEmail.match(/<body[^>]*>([\s\S]*?)<\/body>/i)

  if (bodyMatch && bodyMatch[1]) {
    // Return the inner content of the body tag
    return bodyMatch[1].trim()
  }

  // If no body tag found, return the original content
  // This handles cases where the email might already be just content
  return htmlEmail
}

// Made with Bob
