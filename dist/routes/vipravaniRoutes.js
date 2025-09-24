"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vipravaniRepo_1 = require("../repos/vipravaniRepo");
const upload_1 = __importDefault(require("../middleware/upload"));
const filetobase64converter_1 = require("../middleware/filetobase64converter");
const router = (0, express_1.Router)();
// Add Vipravani
router.post("/add", upload_1.default.single("filePath"), (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const { title, status } = req.body;
      const filePath = req.file ? req.file.path : "";
      const vipravani = yield vipravaniRepo_1.VipravaniRepo.create({
        title,
        filePath,
        status,
      });
      res.json({ message: "Vipravani created successfully", vipravani });
    } catch (err) {
      console.error("Error creating vipravani:", err);
      res.status(500).json({ error: "Failed to create vipravani" });
    }
  })
);
// Update Vipravani
router.put("/update/:id", upload_1.default.single("file"), (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const { id } = req.params;
      const updateData = Object.assign({}, req.body);
      if (req.file) {
        updateData.filePath = req.file.path;
      }
      const vipravani = yield vipravaniRepo_1.VipravaniRepo.update(
        id,
        updateData
      );
      res.json({ message: "Vipravani updated successfully", vipravani });
    } catch (err) {
      console.error("Error updating vipravani:", err);
      res.status(500).json({ error: "Failed to update vipravani" });
    }
  })
);
// Delete Vipravani
router.delete("/delete/:id", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const { id } = req.params;
      yield vipravaniRepo_1.VipravaniRepo.delete(id);
      res.json({ message: "Vipravani deleted successfully" });
    } catch (err) {
      console.error("Error deleting vipravani:", err);
      res.status(500).json({ error: "Failed to delete vipravani" });
    }
  })
);
// Get All Vipravani
router.get("/", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const vipravaniLists = yield vipravaniRepo_1.VipravaniRepo.getAll();
      const vipravani = vipravaniLists.map((list) => {
        var _a, _b;
        const base64File = list.filePath
          ? (0, filetobase64converter_1.fileToBase64)(list.filePath)
          : null;
        return Object.assign(
          Object.assign(
            {},
            (_b =
              (_a = list.toObject) === null || _a === void 0
                ? void 0
                : _a.call(list)) !== null && _b !== void 0
              ? _b
              : list
          ),
          { filePath: base64File }
        );
      });
      res.json(vipravani);
    } catch (err) {
      console.error("Error fetching vipravani:", err);
      res.status(500).json({ error: "Failed to fetch vipravani list" });
    }
  })
);
// Get Single Vipravani
router.get("/:id", (req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      const { id } = req.params;
      const vipravani = yield vipravaniRepo_1.VipravaniRepo.getById(id);
      if (!vipravani) {
        return res.status(404).json({ error: "Vipravani not found" });
      }
      res.json(vipravani);
    } catch (err) {
      console.error("Error fetching vipravani:", err);
      res.status(500).json({ error: "Failed to fetch vipravani" });
    }
  })
);
exports.default = router;
