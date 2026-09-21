const Homework = require('../models/Homework');
const Student = require('../models/Student');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const { notifyGuardianMissingHomework } = require('./notificationService');
const { HOMEWORK_STATUS, HOMEWORK_SUBMISSION_STATUS, STUDENT_STATUS } = require('../config/constants');

const detectMissingHomework = async () => {
  const now = new Date();
  
  const overdueHomeworks = await Homework.find({
    status: HOMEWORK_STATUS.PUBLISHED,
    dueAt: { $lt: now }
  });

  let missingCount = 0;

  for (const hw of overdueHomeworks) {
    const students = await Student.find({ classId: hw.classId, status: STUDENT_STATUS.ACTIVE });
    
    for (const student of students) {
      const submission = await HomeworkSubmission.findOne({
        homeworkId: hw._id,
        studentId: student._id,
        status: { $ne: HOMEWORK_SUBMISSION_STATUS.NOT_SUBMITTED }
      });
      
      if (!submission) {
        await notifyGuardianMissingHomework(student._id, hw._id, hw.title);
        missingCount++;
      }
    }
  }
  return missingCount;
};

module.exports = { detectMissingHomework };
