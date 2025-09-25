import VipravaniModel, { vipravaniDocument } from "../models/vipravani.ts";

export class VipravaniRepo {
  static async create(data: Partial<vipravaniDocument>) {
    const vipravani = new VipravaniModel(data);
    return vipravani.save();
  }

  static async getAll() {
    return VipravaniModel.find().sort({ createdAt: -1 });
  }

  static async getById(id: string) {
    return VipravaniModel.findById(id);
  }

  static async update(id: string, data: Partial<vipravaniDocument>) {
    return VipravaniModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id: string) {
    return VipravaniModel.findByIdAndDelete(id);
  }
}
