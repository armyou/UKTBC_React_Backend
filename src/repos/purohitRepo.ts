import PurohitModel, { purohitDocument } from "../models/purohit";

export class PurohitRepo {
  static async create(data: Partial<purohitDocument>) {
    const purohit = new PurohitModel(data);
    return purohit.save();
  }

  static async getAll() {
    return PurohitModel.find().sort({ createdAt: -1 });
  }

  static async getById(id: string) {
    return PurohitModel.findById(id);
  }

  static async update(id: string, data: Partial<purohitDocument>) {
    return PurohitModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id: string) {
    return PurohitModel.findByIdAndDelete(id);
  }
}
