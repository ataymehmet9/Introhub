/**
 * Converts plain text with newlines to React Email compatible format
 * Splits text by newlines and wraps each line in a Text component with proper spacing
 */
export const formatMessageWithLineBreaks = (message: string) => {
  if (!message) return null

  // Split by newlines and filter out empty strings
  const lines = message.split('\n')

  return lines.map((line, index) => {
    // For empty lines, render a space to maintain spacing
    const content = line.trim() === '' ? '\u00A0' : line

    return (
      <span key={index}>
        {content}
        {index < lines.length - 1 && <br />}
      </span>
    )
  })
}

// Made with Bob
