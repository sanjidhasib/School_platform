const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true, index: true },
    academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicSession", index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teacherAssignmentSchema.index({ teacherId: 1, classId: 1, subjectId: 1, academicSessionId: 1 }, { unique: true });

module.exports = mongoose.model("TeacherAssignment", teacherAssignmentSchema);
