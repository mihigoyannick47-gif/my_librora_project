const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signToken } = require('../utils/jwt');

async function register(req, res) {
  try {
    const { full_name, email, password, phone, address } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [normalizedEmail]);

    if (existing.length) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name.trim(), normalizedEmail, passwordHash, phone || null, address || null, 'member']
    );

    const token = signToken({ userId: result.insertId, role: 'member' });

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        user_id: result.insertId,
        full_name: full_name.trim(),
        email: normalizedEmail,
        role: 'member'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Could not register user.', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [rows] = await db.query('SELECT user_id, full_name, email, password, role FROM users WHERE email = ?', [normalizedEmail]);

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken({ userId: user.user_id, role: user.role });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed.', error: error.message });
  }
}

async function getCurrentUser(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  register,
  login,
  getCurrentUser
};
