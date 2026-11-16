const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const frontendDir = path.join(__dirname, '..', 'frontend');

app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS ok');
    res.json({
      status: 'ok',
      database: rows[0]?.ok === 1 ? 'connected' : 'unavailable'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed.',
      error: error.message
    });
  }
});

app.use('/assets', express.static(path.join(frontendDir, 'assets')));
app.use('/css', express.static(path.join(frontendDir, 'css')));
app.use('/js', express.static(path.join(frontendDir, 'js')));
app.use('/images', express.static(path.join(frontendDir, 'images')));
app.use('/pages', express.static(path.join(frontendDir, 'pages')));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendDir, 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(frontendDir, 'register.html'));
});

app.get('/details', (req, res) => {
  res.sendFile(path.join(frontendDir, 'details.html'));
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong.'
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`LIBRORA server is running on http://localhost:${port}`);
  });
}

module.exports = app;
