import express from 'express';
import { upload } from '../config/storage.js';
import {
  upsertUser,
  getUserById,
  getUserLeaderboard,
  getLostItems,
  getFoundItems,
  getLostItemById,
  getFoundItemById,
  createLostItem,
  createFoundItem,
  deleteItem,
  updateItem,
  createClaim,
  respondToClaim,
  getNotifications,
  markNotificationRead,
  getItemQrCode,
  getAdminAnalytics,
  getUserDashboardData,
  getItemComments,
  createItemComment
} from '../controllers/apiControllers.js';

const router = express.Router();

// Image Upload Endpoint
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  // Cloudinary storage directly provides the web URL in req.file.path
  const imageUrl = req.file.path;
  res.json({ imageUrl });
});

// User routes
router.post('/users', upsertUser);
router.get('/users/leaderboard', getUserLeaderboard);
router.get('/users/:uid', getUserById);
router.get('/users/:userId/dashboard', getUserDashboardData);

// Lost & Found items routes
router.get('/lost-items', getLostItems);
router.get('/found-items', getFoundItems);
router.get('/lost-items/:id', getLostItemById);
router.get('/found-items/:id', getFoundItemById);
router.post('/lost-items', createLostItem);
router.post('/found-items', createFoundItem);
router.put('/items/:type/:id', updateItem);
router.delete('/items/:type/:id', deleteItem);
router.get('/items/qr/:itemId', getItemQrCode);

// Claim routes
router.post('/claims', createClaim);
router.post('/claims/:id/respond', respondToClaim);

// Notification routes
router.get('/notifications/:userId', getNotifications);
router.post('/notifications/:id/read', markNotificationRead);

// Comment routes
router.get('/items/:itemId/comments', getItemComments);
router.post('/items/:itemId/comments', createItemComment);

// Admin routes
router.get('/admin/analytics', getAdminAnalytics);

export default router;
