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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MadiVantaluRepo = void 0;
const madiVantalu_1 = __importDefault(require("../models/madiVantalu"));
class MadiVantaluRepo {
    static create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const madiVantalu = new madiVantalu_1.default(data);
            return madiVantalu.save();
        });
    }
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return madiVantalu_1.default.find().sort({ createdAt: -1 });
        });
    }
    static getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return madiVantalu_1.default.findById(id);
        });
    }
    static update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return madiVantalu_1.default.findByIdAndUpdate(id, data, { new: true });
        });
    }
    static delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return madiVantalu_1.default.findByIdAndDelete(id);
        });
    }
    static getLatestMadivantalu() {
        return __awaiter(this, void 0, void 0, function* () {
            return madiVantalu_1.default.find().sort({ createdAt: -1 }).limit(3);
        });
    }
}
exports.MadiVantaluRepo = MadiVantaluRepo;
