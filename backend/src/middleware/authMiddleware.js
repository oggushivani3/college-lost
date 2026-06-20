// backend/src/middleware/authMiddleware.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' });
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.userUid = decoded.uid;
    next();
  } catch (err) {
    console.error('Auth verification failed:', err);
    return res.status(401).json({ error: 'Invalid auth token' });
  }
};
