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
exports.ProjectRepo = void 0;
const projects_1 = __importDefault(require("../models/projects"));
class ProjectRepo {
    static createProject(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = new projects_1.default(data);
            return project.save();
        });
    }
    static getAllProjects() {
        return __awaiter(this, void 0, void 0, function* () {
            return projects_1.default.find().sort({ createdAt: -1 });
        });
    }
    static getProjectById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return projects_1.default.findById(id);
        });
    }
    static updateProject(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return projects_1.default.findByIdAndUpdate(id, data, { new: true });
        });
    }
    static deleteProject(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return projects_1.default.findByIdAndDelete(id);
        });
    }
}
exports.ProjectRepo = ProjectRepo;
