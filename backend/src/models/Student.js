const mongoose = require("mongoose");
const { STUDENT_STATUS } = require("../config/constants");

const studentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Male" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", index: true },
    guardianIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Guardian" }],
    rollNumber: { type: String, default: "" },
    admissionDate: { type: Date },
    status: { type: String, enum: Object.values(STUDENT_STATUS), default: STUDENT_STATUS.ACTIVE, index: true },
    photoUrl: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
  },
  { timestamps: true }
);

studentSchema.index({ classId: 1, status: 1 });

module.exports = mongoose.model("Student", studentSchema);
