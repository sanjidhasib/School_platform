const mongoose = require("mongoose");
const { TEACHER_STATUS } = require("../config/constants");

const teacherSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacherId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    degree: { type: String, default: "" },
    specialization: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    joiningDate: { type: Date },
    status: { type: String, enum: Object.values(TEACHER_STATUS), default: TEACHER_STATUS.ACTIVE },
    photoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);
