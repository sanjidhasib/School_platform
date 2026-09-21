const Class = require('../models/Class');
const Student = require('../models/Student');
const ApiError = require('../utils/ApiError');
const { STUDENT_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

const checkClassCapacity = async (classId, session) => {
  const classDoc = await Class.findById(classId).session(session);
  if (!classDoc) {
    throw new ApiError(404, 'Class not found');
  }
  
  const currentStudentsCount = await Student.countDocuments({
    classId: classId,
    status: STUDENT_STATUS.ACTIVE
  }).session(session);
  
  if (currentStudentsCount >= classDoc.capacity) {
    throw new ApiError(400, `Class capacity of ${classDoc.capacity} has been reached`);
  }
  
  return true;
};

module.exports = { checkClassCapacity };
