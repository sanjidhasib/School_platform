const Timetable = require('../models/Timetable');
const TeacherAssignment = require('../models/TeacherAssignment');
const ApiError = require('../utils/ApiError');

const checkClassConflict = async (classId, dayOfWeek, startTime, excludeTimetableId = null) => {
  const query = { classId, dayOfWeek, startTime, isActive: true };
  if (excludeTimetableId) {
    query._id = { $ne: excludeTimetableId };
  }
  
  const conflict = await Timetable.findOne(query);
  if (conflict) {
    throw new ApiError(400, 'Class already has a scheduled class at this time');
  }
};

const checkTeacherConflict = async (teacherAssignmentId, dayOfWeek, startTime, excludeTimetableId = null) => {
  const assignment = await TeacherAssignment.findById(teacherAssignmentId);
  if (!assignment) {
    throw new ApiError(404, 'Teacher Assignment not found');
  }
  
  const teacherAssignments = await TeacherAssignment.find({ teacherId: assignment.teacherId, isActive: true });
  const assignmentIds = teacherAssignments.map(a => a._id);
  
  const query = {
    teacherAssignmentId: { $in: assignmentIds },
    dayOfWeek,
    startTime,
    isActive: true
  };
  
  if (excludeTimetableId) {
    query._id = { $ne: excludeTimetableId };
  }
  
  const conflict = await Timetable.findOne(query);
  if (conflict) {
    throw new ApiError(400, 'Teacher already has a scheduled class at this time');
  }
};

module.exports = { checkClassConflict, checkTeacherConflict };
