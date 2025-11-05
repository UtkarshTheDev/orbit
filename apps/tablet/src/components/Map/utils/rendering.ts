// Text and rendering utilities for Map components

export const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  const charWidth = fontSize * 0.6; // Approximate character width

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = testLine.length * charWidth;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};