const mongoose = require('mongoose');
const { HOMEWORK_SUBMISSION_STATUS } = require('../config/constants');

const homeworkSubmissionSchema = new mongoose.Schema({
  homeworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  answerText: { type: String },
  attachmentUrl: { type: String },
  submittedAt: { type: Date },
  status: { type: String, enum: Object.values(HOMEWORK_SUBMISSION_STATUS), default: HOMEWORK_SUBMISSION_STATUS.NOT_SUBMITTED },
  marks: { type: Number },
  feedback: { type: String },
  gradedAt: { type: Date },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

homeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
