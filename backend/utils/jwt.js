const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'librora-dev-secret';

function signToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = {
  signToken,
  verifyToken
};
