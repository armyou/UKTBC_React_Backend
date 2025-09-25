"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const EventSchema = new mongoose_1.Schema({
    eventTitle: { type: String, required: true },
    eventDescription: { type: String, required: false },
    eventDate: { type: String, required: true },
    eventTime: { type: String, required: true },
    registrationLink: { type: String, required: false },
}, { _id: false } // optional: prevent Mongo from creating _id for each event
);
const ProjectsSchema = new mongoose_1.Schema({
    projectTitle: { type: String, required: true },
    tagline: { type: String },
    description: { type: String },
    vision: { type: String },
    impactPoints: [{ type: String }],
    projectType: { type: String },
    highlights: { type: String },
    events: [EventSchema], // Array of event objects
    filePath: { type: String },
    status: {
        type: String,
        enum: ["draft", "active", "completed"],
        default: "draft",
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model("projects", ProjectsSchema);
