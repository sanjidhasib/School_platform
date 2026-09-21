const AuditLog = require('../models/AuditLog');

const logAudit = async (userId, action, resourceType, resourceId, details, ipAddress) => {
  try {
    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};

module.exports = { logAudit };
