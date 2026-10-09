const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// POST /api/users/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];
    
    // For production use bcrypt.compare; fallback for plain dump passwords
    const isMatch = password === user.password || await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.user_id, name: user.full_name, role: user.role, student_id: user.student_id }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users (Admin only)
router.get('/', authenticateToken, authorizeRoles('Administrator'), async (req, res, next) => {
  try {
    const [users] = await db.query('SELECT user_id, full_name, email, role, student_id FROM users');
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;