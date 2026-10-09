const express = require('express');
const cors = require('cors');
const app = express();

// 1. GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// 2. SERVE STATIC FRONTEND FILES (PUT IT HERE)
app.use(express.static('public'));

// 3. API ROUTES
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const examRoutes = require('./routes/examRoutes');
const resultRoutes = require('./routes/resultRoutes');

app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/examinations', examRoutes);
app.use('/api/results', resultRoutes);

// 4. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});