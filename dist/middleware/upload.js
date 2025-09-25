"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Storage config
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "assets/"); // save inside root/assets folder
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
// File filter
function fileFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png/;
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const mime = allowed.test(file.mimetype);
    if (mime && allowed.test(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only JPEG and PNG files are allowed"));
    }
}
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
exports.default = upload;
