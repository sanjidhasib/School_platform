const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    nameBn: { type: String, default: "" },
    description: { type: String, default: "" },
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
