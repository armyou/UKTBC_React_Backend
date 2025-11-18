import ProjectsModel, { ProjectsDocument } from "../models/projects";

export class ProjectRepo {
  static async createProject(data: Partial<ProjectsDocument>) {
    const project = new ProjectsModel(data);
    return project.save();
  }

  static async getAllProjects() {
    return ProjectsModel.find().sort({ createdAt: -1 });
  }

  static async getProjectById(id: string) {
    return ProjectsModel.findById(id);
  }

  static async updateProject(id: string, data: Partial<ProjectsDocument>) {
    return ProjectsModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteProject(id: string) {
    return ProjectsModel.findByIdAndDelete(id);
  }
}
