import MadiVantaluModel, { madiVantaluDocument } from "../models/madiVantalu";

export class MadiVantaluRepo {
  static async create(data: Partial<madiVantaluDocument>) {
    const madiVantalu = new MadiVantaluModel(data);
    return madiVantalu.save();
  }

  static async getAll() {
    return MadiVantaluModel.find().sort({ createdAt: -1 });
  }

  static async getById(id: string) {
    return MadiVantaluModel.findById(id);
  }

  static async update(id: string, data: Partial<madiVantaluDocument>) {
    return MadiVantaluModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id: string) {
    return MadiVantaluModel.findByIdAndDelete(id);
  }
  static async getLatestMadivantalu() {
    return MadiVantaluModel.find().sort({ createdAt: -1 }).limit(3);
  }
}
