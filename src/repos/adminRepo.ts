import Admin, { AdminDocument } from "../models/admin.ts";

export const AdminRepo = {
  async createAdmin(data: Partial<AdminDocument>) {
    const admin = new Admin(data);
    return await admin.save();
  },

  async findByEmail(email: string) {
    return await Admin.findOne({ email });
  },
};
