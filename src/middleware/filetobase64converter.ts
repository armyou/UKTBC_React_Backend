import fs from "fs";
import path from "path";
import mime from "mime-types";

/**
 * Converts a file to base64 string with MIME type prefix.
 * @param relativeFilePath File path relative to the project root (e.g., 'uploads/image.png')
 * @returns Base64 string or null if file not found or error occurs
 */
export function fileToBase64(relativeFilePath: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), relativeFilePath); // Adjust if needed
    const fileBuffer = fs.readFileSync(fullPath);

    const mimeType = mime.lookup(fullPath) || "application/octet-stream";

    return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
  } catch (err) {
    console.error(`Error converting file to base64: ${relativeFilePath}`, err);
    return null;
  }
}
