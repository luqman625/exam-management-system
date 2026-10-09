const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/courses (Supports search & pagination)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    const [courses] = await db.query(
      'SELECT * FROM courses WHERE course_name LIKE ? OR course_code LIKE ? LIMIT ? OFFSET ?',
      [search, search, limit, offset]
    );

    res.json({ page, limit, data: courses });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses (Admin only)
router.post('/', authenticateToken, authorizeRoles('Administrator'), async (req, res, next) => {
  try {
    const { course_code, course_name, credit_hour, faculty } = req.body;
    const [result] = await db.query(
      'INSERT INTO courses (course_code, course_name, credit_hour, faculty) VALUES (?, ?, ?, ?)',
      [course_code, course_name, credit_hour, faculty]
    );

    res.status(201).json({ message: 'Course created', course_id: result.insertId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;