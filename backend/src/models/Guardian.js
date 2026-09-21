const mongoose = require("mongoose");

const guardianSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    relation: { type: String, default: "Guardian" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    occupation: { type: String, default: "" },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Guardian", guardianSchema);
