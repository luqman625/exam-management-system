const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sendResultNotification } = require('../services/notificationService');

// GET /api/results (Students view their own; Admin/Lecturer view all)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    let sql = `
      SELECT r.result_id, u.full_name AS student_name, u.student_id, c.course_code, 
             c.course_name, r.marks, r.grade, r.status
      FROM results r
      JOIN users u ON r.student_id = u.user_id
      JOIN examinations e ON r.examination_id = e.examination_id
      JOIN courses c ON e.course_id = c.course_id
    `;
    const params = [];

    if (req.user.role === 'Student') {
      sql += ' WHERE r.student_id = ?';
      params.push(req.user.userId);
    }

    const [results] = await db.query(sql, params);
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
});

// POST /api/results (Admin/Lecturer publish result & send email)
router.post('/', authenticateToken, authorizeRoles('Administrator', 'Lecturer'), async (req, res, next) => {
  try {
    const { student_id, examination_id, marks, grade, status } = req.body;

    const [result] = await db.query(
      'INSERT INTO results (student_id, examination_id, marks, grade, status) VALUES (?, ?, ?, ?, ?)',
      [student_id, examination_id, marks, grade, status]
    );

    // Fetch user details for third-party email notification
    const [info] = await db.query(`
      SELECT u.email, u.full_name, c.course_code 
      FROM users u, examinations e, courses c 
      WHERE u.user_id = ? AND e.examination_id = ? AND e.course_id = c.course_id
    `, [student_id, examination_id]);

    if (info.length > 0) {
      const { email, full_name, course_code } = info[0];
      sendResultNotification(email, full_name, course_code, grade, status).catch(console.error);
    }

    res.status(201).json({ message: 'Result published successfully', result_id: result.insertId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;