"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileToBase64 = fileToBase64;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mime_types_1 = __importDefault(require("mime-types"));
/**
 * Converts a file to base64 string with MIME type prefix.
 * @param relativeFilePath File path relative to the project root (e.g., 'uploads/image.png')
 * @returns Base64 string or null if file not found or error occurs
 */
function fileToBase64(relativeFilePath) {
    try {
        const fullPath = path_1.default.join(process.cwd(), relativeFilePath); // Adjust if needed
        const fileBuffer = fs_1.default.readFileSync(fullPath);
        const mimeType = mime_types_1.default.lookup(fullPath) || "application/octet-stream";
        return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    }
    catch (err) {
        console.error(`Error converting file to base64: ${relativeFilePath}`, err);
        return null;
    }
}
