import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface AdminDocument extends Document {
  email: string;
  password: string;
  status: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<AdminDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { type: String, required: true },
  },
  { timestamps: true }
);

// Hash password before saving
AdminSchema.pre("save", async function (next) {
  const admin = this as AdminDocument;
  if (!admin.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  admin.password = await bcrypt.hash(admin.password, salt);
  next();
});

// Compare password method
AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<AdminDocument>("Admin", AdminSchema);
