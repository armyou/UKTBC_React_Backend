import FooterModel, { footerDocument } from "../models/footer";

export class FooterRepo {
  static async createFooterCount(data: Partial<footerDocument>) {
    const count = new FooterModel(data);
    return count.save();
  }

  static async getCount() {
    return FooterModel.find().sort({ createdAt: -1 });
  }

  // Find latest and increment count by given value
  static async incrementCount(incrementBy: number = 1, status: number = 1) {
    return FooterModel.findOneAndUpdate(
      {},
      {
        $inc: { count: incrementBy },
        $set: { status },
      },
      {
        new: true, // return updated doc
        sort: { createdAt: -1 }, // always update the latest
        upsert: true, // if no record exists, create one
      }
    );
  }
}
