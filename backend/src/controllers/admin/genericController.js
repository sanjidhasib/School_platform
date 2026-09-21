const asyncHandler = require('../../utils/asyncHandler');
const getItems = asyncHandler(async(req, res) => res.json({success: true, data: []}));
const createItem = asyncHandler(async(req, res) => res.json({success: true, data: req.body}));
module.exports = { getItems, createItem };
