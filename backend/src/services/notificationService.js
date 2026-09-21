const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Guardian = require('../models/Guardian');
const { NOTIFICATION_TYPE } = require('../config/constants');

const createNotification = async (data) => {
  try {
    const existing = await Notification.findOne({
      recipientUserId: data.recipientUserId,
      type: data.type,
      relatedEntityId: data.relatedEntityId
    });
    
    if (!existing) {
      await Notification.create(data);
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

const notifyGuardianAbsence = async (studentId, attendanceSessionId) => {
  try {
    const student = await Student.findById(studentId).populate('guardianIds');
    if (!student || !student.guardianIds || student.guardianIds.length === 0) return;

    for (const guardian of student.guardianIds) {
      if (!guardian.userId) continue;
      
      await createNotification({
        recipientUserId: guardian.userId,
        type: NOTIFICATION_TYPE.ABSENCE,
        title: 'Absence Alert',
        message: `${student.fullName} has been marked absent today.`,
        relatedEntityType: 'AttendanceSession',
        relatedEntityId: attendanceSessionId
      });
    }
  } catch (error) {
    console.error('Error notifying guardian absence:', error);
  }
};

const notifyGuardianMissingHomework = async (studentId, homeworkId, title) => {
  try {
    const student = await Student.findById(studentId).populate('guardianIds');
    if (!student || !student.guardianIds || student.guardianIds.length === 0) return;

    for (const guardian of student.guardianIds) {
      if (!guardian.userId) continue;
      
      await createNotification({
        recipientUserId: guardian.userId,
        type: NOTIFICATION_TYPE.MISSING_HOMEWORK,
        title: 'Missing Homework',
        message: `${student.fullName} has missed the homework deadline for: ${title}`,
        relatedEntityType: 'Homework',
        relatedEntityId: homeworkId
      });
    }
  } catch (error) {
    console.error('Error notifying guardian missing homework:', error);
  }
};

module.exports = { createNotification, notifyGuardianAbsence, notifyGuardianMissingHomework };
