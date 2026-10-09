const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { generateExamQRCode } = require('../services/notificationService');

// GET /api/examinations
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const [exams] = await db.query(`
      SELECT e.examination_id, c.course_code, c.course_name, v.venue_name, v.building, 
             e.exam_date, e.start_time, e.end_time, e.exam_type
      FROM examinations e
      JOIN courses c ON e.course_id = c.course_id
      JOIN venues v ON e.venue_id = v.venue_id
    `);
    res.json({ data: exams });
  } catch (err) {
    next(err);
  }
});

// GET /api/examinations/:id/qrcode (Third-Party Integration)
router.get('/:id/qrcode', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT e.examination_id, c.course_code, v.venue_name, e.exam_date, e.start_time
      FROM examinations e
      JOIN courses c ON e.course_id = c.course_id
      JOIN venues v ON e.venue_id = v.venue_id
      WHERE e.examination_id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Exam not found' });

    const exam = rows[0];
    const payload = `Exam: ${exam.course_code} | Date: ${exam.exam_date} | Venue: ${exam.venue_name}`;
    const qrCodeImage = await generateExamQRCode(payload);

    res.json({ examination_id: exam.examination_id, qr_code: qrCodeImage });
  } catch (err) {
    next(err);
  }
});

// POST /api/examinations
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { course_id, venue_name, building, exam_date, start_time, end_time, exam_type } = req.body;

    const [result] = await db.query(
      `INSERT INTO examinations (course_id, venue_name, building, exam_date, start_time, end_time, exam_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [course_id, venue_name, building, exam_date, start_time, end_time, exam_type]
    );

    res.status(201).json({
      message: 'Examination scheduled successfully',
      examination_id: result.insertId
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;