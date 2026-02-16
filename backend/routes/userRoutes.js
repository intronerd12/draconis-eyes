const express = require('express');
const router = express.Router();
const { getUsers, updateUser, deleteUser, uploadAvatar } = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');

// TODO: Add protect and admin middleware
router.get('/', getUsers);
router.put('/:id', updateUser);
router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/:id', deleteUser);

module.exports = router;
