const express = require('express');
const { getItems, createItem } = require('../../controllers/admin/genericController');
const router = express.Router();
router.get('/', getItems);
router.post('/', createItem);
module.exports = router;
