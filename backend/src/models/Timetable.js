const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    teacherAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherAssignment", required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: "" },
    academicSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicSession" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

timetableSchema.index({ classId: 1, dayOfWeek: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model("Timetable", timetableSchema);
