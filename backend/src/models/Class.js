const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    gradeNumber: { type: Number, required: true, index: true },
    section: { type: String, default: "A" },
    academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicSession", index: true },
    capacity: { type: Number, default: 40 },
    room: { type: String, default: "" },
    classTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

classSchema.index({ gradeNumber: 1, section: 1, academicSessionId: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);
