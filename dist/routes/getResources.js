"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const filetobase64converter_1 = require("../middleware/filetobase64converter");
const resourceRepo_1 = require("../repos/resourceRepo");
const router = (0, express_1.Router)();
// Get All Events
router.get("/latest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const panchangamList = yield resourceRepo_1.ResourceRepo.getLatestPanchangam({
            resourceType: "Panchangam",
            sortBy: { createdAt: -1 },
            limit: 3,
        });
        const reportsList = yield resourceRepo_1.ResourceRepo.getLatestReports({
            resourceType: "Report",
            sortBy: { createdAt: -1 },
            limit: 3,
        });
        const panchangamData = panchangamList.map((item) => {
            var _a, _b;
            const base64File = item.filePath ? (0, filetobase64converter_1.fileToBase64)(item.filePath) : null;
            return Object.assign(Object.assign({}, ((_b = (_a = item.toObject) === null || _a === void 0 ? void 0 : _a.call(item)) !== null && _b !== void 0 ? _b : item)), { filePath: base64File });
        });
        const reportsData = reportsList.map((item) => {
            var _a, _b;
            const base64File = item.filePath ? (0, filetobase64converter_1.fileToBase64)(item.filePath) : null;
            return Object.assign(Object.assign({}, ((_b = (_a = item.toObject) === null || _a === void 0 ? void 0 : _a.call(item)) !== null && _b !== void 0 ? _b : item)), { filePath: base64File });
        });
        res.json({ panchangam: panchangamData, reports: reportsData });
    }
    catch (err) {
        console.error("Error fetching events:", err);
        res.status(500).json({ error: "Failed to fetch events" });
    }
}));
exports.default = router;
