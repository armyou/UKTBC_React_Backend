import multer from "multer";
import path from "path";
import fs from "fs";

const assetsPath = path.join(process.cwd(), "assets");

// Ensure the folder exists
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath);
}

// Use diskStorage since we want to save Excel files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, assetsPath);
  },
  filename: function (req, file, cb) {
    // Use timestamp to avoid overwriting
    const uniqueName = `${file.fieldname}-${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });
