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
exports.FooterRepo = void 0;
const footer_1 = __importDefault(require("../models/footer"));
class FooterRepo {
    static createFooterCount(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = new footer_1.default(data);
            return count.save();
        });
    }
    static getCount() {
        return __awaiter(this, void 0, void 0, function* () {
            return footer_1.default.find().sort({ createdAt: -1 });
        });
    }
    // Find latest and increment count by given value
    static incrementCount() {
        return __awaiter(this, arguments, void 0, function* (incrementBy = 1, status = 1) {
            return footer_1.default.findOneAndUpdate({}, {
                $inc: { count: incrementBy },
                $set: { status },
            }, {
                new: true, // return updated doc
                sort: { createdAt: -1 }, // always update the latest
                upsert: true, // if no record exists, create one
            });
        });
    }
}
exports.FooterRepo = FooterRepo;
