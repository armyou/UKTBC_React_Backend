import ResourcesModel, { resourcesDocument } from "../models/resources.ts";

export class ResourceRepo {
  static async createResource(data: Partial<resourcesDocument>) {
    const resource = new ResourcesModel(data);
    return resource.save();
  }

  static async getAllResources() {
    return ResourcesModel.find().sort({ createdAt: -1 });
  }

  static async getResourceById(id: string) {
    return ResourcesModel.findById(id);
  }

  static async updateResource(id: string, data: Partial<resourcesDocument>) {
    return ResourcesModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteResource(id: string) {
    return ResourcesModel.findByIdAndDelete(id);
  }
  static async getLatestPanchangam(p0: {
    resourceType: string;
    sortBy: { createdAt: number };
    limit: number;
  }) {
    return ResourcesModel.find({ resourceType: "Panchangam" })
      .sort({ createdAt: -1 })
      .limit(3);
  }
  static async getLatestReports(p0: {
    resourceType: string;
    sortBy: { createdAt: number };
    limit: number;
  }) {
    return ResourcesModel.find({ resourceType: "Report" })
      .sort({ createdAt: -1 })
      .limit(3);
  }
}
