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
const footerRepo_1 = require("../repos/footerRepo");
const router = (0, express_1.Router)();
router.put("/counter", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const incrementBy = 1;
        const status = 1;
        const updatedCount = yield footerRepo_1.FooterRepo.incrementCount(incrementBy, status);
        res.json({
            message: "Count updated successfully",
            count: updatedCount === null || updatedCount === void 0 ? void 0 : updatedCount.count,
            data: updatedCount,
        });
    }
    catch (err) {
        console.error("Error updating count:", err);
        res.status(500).json({ error: "Failed to update count" });
    }
}));
exports.default = router;
