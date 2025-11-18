import Admin, { AdminDocument } from "../models/admin";
import { Types } from "mongoose";

export const AdminRepo = {
  async createAdmin(data: Partial<AdminDocument>) {
    const admin = new Admin(data);
    return await admin.save();
  },

  async findByEmail(email: string) {
    return await Admin.findOne({ email });
  },
};

// to get admin profile details
export interface AdminProfile {
  _id: string;
  email: string;
  status: string;
}

export const getAdminProfileDetails = async (
  adminId: string | Types.ObjectId
): Promise<AdminProfile | null> => {
  // Validate ObjectId
  if (!Types.ObjectId.isValid(adminId)) {
    throw new Error("Invalid admin ID");
  }

  // Fetch admin details (exclude password)
  const admin = await Admin.findById(adminId, {
    password: 0,
  }).lean<AdminProfile>();

  if (!admin) {
    return null; // admin not found
  }

  return admin;
};
