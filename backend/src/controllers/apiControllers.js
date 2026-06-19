import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { checkMatches } from '../services/matchingService.js';
import { db } from '../config/db.js';

const enrichWithReporterEmail = async (items) => {
  try {
    const users = await db.users.find();
    const userMap = new Map(users.map(u => [u.uid, u.email]));
    
    if (Array.isArray(items)) {
      return items.map(item => {
        const obj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
        obj.reporterEmail = userMap.get(obj.reporterId) || 'Unknown User';
        return obj;
      });
    } else {
      if (!items) return items;
      const obj = typeof items.toObject === 'function' ? items.toObject() : { ...items };
      obj.reporterEmail = userMap.get(obj.reporterId) || 'Unknown User';
      return obj;
    }
  } catch (err) {
    console.error('Error enriching items:', err);
    return items;
  }
};

// USER ENDPOINTS
export const upsertUser = async (req, res) => {
  const { uid, name, email, photoURL } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and Email are required' });
  }

  try {
    let user = await db.users.findOne({ uid });

    if (user) {
      // Update existing user details if they changed
      const updateFields = {
        name: name || user.name,
        photoURL: photoURL || user.photoURL
      };
      user = await db.users.updateOne({ uid }, updateFields);
    } else {
      // Create new student user (first user gets admin role, others student)
      const allUsers = await db.users.find();
      const isAdmin = allUsers.length === 0 || email.startsWith('admin@');
      
      user = await db.users.create({
        uid,
        name: name || email.split('@')[0],
        email,
        photoURL: photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${uid}`,
        role: isAdmin ? 'admin' : 'student',
        points: 0,
        contactNumber: '',
        createdAt: new Date().toISOString()
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error in upsertUser:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getUserLeaderboard = async (req, res) => {
  try {
    const users = await db.users.find();
    // Sort users by points descending, filter out admin users or show only students
    const leaderboard = users
      .filter(u => u.role !== 'admin')
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error in getUserLeaderboard:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ITEM ENDPOINTS
export const getLostItems = async (req, res) => {
  try {
    const items = await db.lostItems.find();
    const { category, location, search, date, status } = req.query;

    let filtered = items;
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    } else {
      filtered = filtered.filter(item => item.status !== 'Returned');
    }

    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }
    if (location) {
      filtered = filtered.filter(item => item.lastSeenLocation === location);
    }
    if (date) {
      filtered = filtered.filter(item => item.dateLost === date);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(await enrichWithReporterEmail(filtered));
  } catch (error) {
    console.error('Error in getLostItems:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getFoundItems = async (req, res) => {
  try {
    const items = await db.foundItems.find();
    const { category, location, search, date, status } = req.query;

    let filtered = items;
    if (status) {
      filtered = filtered.filter(item => item.status === status);
    } else {
      filtered = filtered.filter(item => item.status !== 'Returned');
    }

    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }
    if (location) {
      filtered = filtered.filter(item => item.locationFound === location);
    }
    if (date) {
      filtered = filtered.filter(item => item.dateFound === date);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(await enrichWithReporterEmail(filtered));
  } catch (error) {
    console.error('Error in getFoundItems:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getLostItemById = async (req, res) => {
  try {
    const item = await db.lostItems.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(await enrichWithReporterEmail(item));
  } catch (error) {
    console.error('Error in getLostItemById:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getFoundItemById = async (req, res) => {
  try {
    const item = await db.foundItems.findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(await enrichWithReporterEmail(item));
  } catch (error) {
    console.error('Error in getFoundItemById:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createLostItem = async (req, res) => {
  const { name, category, description, lastSeenLocation, dateLost, contactNumber, reporterId, imageUrl } = req.body;
  if (!name || !category || !description || !lastSeenLocation || !dateLost || !reporterId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newItem = await db.lostItems.create({
      id: `lost-${uuidv4().substr(0, 8)}`,
      reporterId,
      name,
      category,
      description,
      lastSeenLocation,
      dateLost,
      imageUrl: imageUrl || '',
      contactNumber: contactNumber || '',
      status: 'Lost',
      createdAt: new Date().toISOString()
    });

    // Trigger AI Matching check asynchronously
    setTimeout(async () => {
      try {
        await checkMatches(newItem, 'lost');
      } catch (err) {
        console.error('Error checking matches:', err);
      }
    }, 0);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error in createLostItem:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createFoundItem = async (req, res) => {
  const { name, category, description, locationFound, dateFound, additionalNotes, reporterId, imageUrl } = req.body;
  if (!name || !category || !description || !locationFound || !dateFound || !reporterId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newItem = await db.foundItems.create({
      id: `found-${uuidv4().substr(0, 8)}`,
      reporterId,
      name,
      category,
      description,
      locationFound,
      dateFound,
      imageUrl: imageUrl || '',
      additionalNotes: additionalNotes || '',
      status: 'Found',
      createdAt: new Date().toISOString()
    });

    // Trigger AI Matching check asynchronously
    setTimeout(async () => {
      try {
        await checkMatches(newItem, 'found');
      } catch (err) {
        console.error('Error checking matches:', err);
      }
    }, 0);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error in createFoundItem:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteItem = async (req, res) => {
  const { type, id } = req.params;
  const collection = type === 'lost' ? db.lostItems : db.foundItems;
  
  try {
    const result = await collection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error in deleteItem:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// CLAIM ENDPOINTS
export const createClaim = async (req, res) => {
  const { lostItemId, foundItemId, claimantId, finderId } = req.body;
  if (!foundItemId || !claimantId || !finderId) {
    return res.status(400).json({ error: 'Missing claim details' });
  }

  try {
    const foundItem = await db.foundItems.findOne({ id: foundItemId });
    if (!foundItem) return res.status(404).json({ error: 'Found item not found' });
    
    if (foundItem.status === 'Claimed' || foundItem.status === 'Returned') {
      return res.status(400).json({ error: 'Item is already claimed or returned' });
    }

    const newClaim = await db.claims.create({
      id: `claim-${uuidv4().substr(0, 8)}`,
      lostItemId: lostItemId || '',
      foundItemId,
      claimantId,
      finderId,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    // Update found item status to Claimed
    await db.foundItems.updateOne({ id: foundItemId }, { status: 'Claimed' });

    // Notify the finder
    const claimantUser = await db.users.findOne({ uid: claimantId });
    const claimantName = claimantUser ? claimantUser.name : 'A user';

    await db.notifications.create({
      id: `notif-${Date.now()}-${uuidv4().substr(0, 4)}`,
      userId: finderId,
      type: 'claim_request',
      message: `${claimantName} has claimed the '${foundItem.name}' you reported found. Review the request in your dashboard.`,
      relatedItemId: foundItemId,
      read: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json(newClaim);
  } catch (error) {
    console.error('Error in createClaim:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const respondToClaim = async (req, res) => {
  const { id } = req.params; // Claim ID
  const { response } = req.body; // 'Accept' or 'Reject'

  if (response !== 'Accept' && response !== 'Reject') {
    return res.status(400).json({ error: 'Invalid response. Use Accept or Reject.' });
  }

  try {
    const claim = await db.claims.findOne({ id });
    if (!claim) return res.status(404).json({ error: 'Claim request not found' });

    if (claim.status !== 'Pending') {
      return res.status(400).json({ error: 'Claim has already been resolved' });
    }

    const foundItem = await db.foundItems.findOne({ id: claim.foundItemId });
    const lostItem = claim.lostItemId ? await db.lostItems.findOne({ id: claim.lostItemId }) : null;
    const finderUser = await db.users.findOne({ uid: claim.finderId });
    const claimantUser = await db.users.findOne({ uid: claim.claimantId });

    const finderName = finderUser ? finderUser.name : 'The finder';

    if (response === 'Accept') {
      await db.claims.updateOne({ id }, { status: 'Accepted' });

      // 1. Mark found item as Returned
      if (foundItem) await db.foundItems.updateOne({ id: claim.foundItemId }, { status: 'Returned' });
      // 2. Mark corresponding lost item as Returned
      if (lostItem) await db.lostItems.updateOne({ id: claim.lostItemId }, { status: 'Returned' });

      // 3. Award points to the finder (+50 points)
      if (finderUser) {
        await db.users.updateOne({ uid: claim.finderId }, { points: (finderUser.points || 0) + 50 });
      }

      // 4. Notify both users
      // 4. Notify both users
      await db.notifications.create({
        id: `notif-${Date.now()}-c`,
        userId: claim.claimantId,
        type: 'claim_response',
        message: `${finderName} accepted your claim for '${foundItem?.name || 'Item'}'. You can contact them to arrange pickup!`,
        relatedItemId: claim.foundItemId,
        read: false,
        createdAt: new Date().toISOString()
      });

      await db.notifications.create({
        id: `notif-${Date.now()}-f`,
        userId: claim.finderId,
        type: 'system',
        message: `Return confirmed! You helped return '${foundItem?.name || 'Item'}' to ${claimantUser?.name || 'its owner'}. +50 points awarded to you!`,
        relatedItemId: claim.foundItemId,
        read: false,
        createdAt: new Date().toISOString()
      });

      // 5. Notify the original lost item reporter about the successful return
      if (lostItem && lostItem.reporterId) {
        await db.notifications.create({
          id: `notif-${Date.now()}-r`,
          userId: lostItem.reporterId,
          type: 'system',
          message: `Your lost item '${lostItem.name}' has been returned successfully to its owner.`,
          relatedItemId: lostItem.id,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

    } else {
      await db.claims.updateOne({ id }, { status: 'Rejected' });

      // Reset found item back to Found
      if (foundItem) await db.foundItems.updateOne({ id: claim.foundItemId }, { status: 'Found' });

      await db.notifications.create({
        id: `notif-${Date.now()}-c-rej`,
        userId: claim.claimantId,
        type: 'claim_response',
        message: `${finderName} rejected your claim for '${foundItem?.name || 'Item'}'. Feel free to reach out or double-check the item description.`,
        relatedItemId: claim.foundItemId,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ message: `Claim request has been ${response.toLowerCase()}ed`, claim: { ...claim, status: response === 'Accept' ? 'Accepted' : 'Rejected' } });
  } catch (error) {
    console.error('Error in respondToClaim:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// NOTIFICATION ENDPOINTS
export const getNotifications = async (req, res) => {
  const { userId } = req.params;
  try {
    const notifications = await db.notifications.find({ userId });
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(notifications);
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await db.notifications.findOne({ id });

    if (notification) {
      await db.notifications.updateOne({ id }, { read: true });
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Notification not found' });
  } catch (error) {
    console.error('Error in markNotificationRead:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// QR CODE GENERATION
export const getItemQrCode = async (req, res) => {
  const { itemId } = req.params;
  try {
    const clientUrl = `http://localhost:5173/items/details/${itemId}`;
    const qrImageUrl = await QRCode.toDataURL(clientUrl);
    res.json({ qrCodeUrl: qrImageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR Code' });
  }
};

// ADMIN ANALYTICS
export const getAdminAnalytics = async (req, res) => {
  try {
    const lostItems = await db.lostItems.find();
    const foundItems = await db.foundItems.find();
    const users = await db.users.find();

    const totalReports = lostItems.length + foundItems.length;

    // Calculate Recovery rate
    const returnedLost = lostItems.filter(item => item.status === 'Returned').length;
    const totalReturned = returnedLost + foundItems.filter(item => item.status === 'Returned').length;
    
    const recoveryRate = lostItems.length > 0 
      ? Math.round((returnedLost / lostItems.length) * 100) 
      : 0;

    // Most commonly lost items
    const categoryCounts = {};
    lostItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
    const mostCommonItems = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most common locations
    const locationCounts = {};
    lostItems.forEach(item => {
      locationCounts[item.lastSeenLocation] = (locationCounts[item.lastSeenLocation] || 0) + 1;
    });
    foundItems.forEach(item => {
      locationCounts[item.locationFound] = (locationCounts[item.locationFound] || 0) + 1;
    });
    const mostCommonLocations = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalUsers = users.length;
    const studentUsers = users.filter(u => u.role === 'student');

    res.json({
      totalReports,
      totalReturned,
      recoveryRate,
      mostCommonItems,
      mostCommonLocations,
      totalUsers,
      activeUsersCount: studentUsers.length
    });
  } catch (error) {
    console.error('Error in getAdminAnalytics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DASHBOARD ENDPOINTS FOR A USER
export const getUserDashboardData = async (req, res) => {
  const { userId } = req.params;
  try {
    const lostItems = await db.lostItems.find();
    const foundItems = await db.foundItems.find();
    const claims = await db.claims.find();

    const myLost = lostItems.filter(item => item.reporterId === userId);
    const myFound = foundItems.filter(item => item.reporterId === userId);

    const myClaims = claims.filter(c => c.claimantId === userId).map(claim => {
      const foundItem = foundItems.find(f => f.id === claim.foundItemId);
      return { ...claim, item: foundItem };
    });

    const incomingClaims = claims.filter(c => c.finderId === userId && c.status === 'Pending').map(claim => {
      const foundItem = foundItems.find(f => f.id === claim.foundItemId);
      return { ...claim, item: foundItem };
    });

    const returnedItems = [
      ...lostItems.filter(item => item.reporterId === userId && item.status === 'Returned'),
      ...foundItems.filter(item => item.reporterId === userId && item.status === 'Returned')
    ];

    res.json({
      myLost,
      myFound,
      myClaims,
      incomingClaims,
      returnedItems,
    });
  } catch (error) {
    console.error('Error in getUserDashboardData:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// COMMENT CHAT ENDPOINTS
export const getItemComments = async (req, res) => {
  const { itemId } = req.params;
  try {
    const comments = await db.comments.find({ itemId });
    // Sort by oldest first so chat reads in order
    comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(comments);
  } catch (error) {
    console.error('Error in getItemComments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createItemComment = async (req, res) => {
  const { itemId } = req.params;
  const { userId, userName, userPhotoURL, message } = req.body;

  if (!userId || !userName || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newComment = await db.comments.create({
      id: `comment-${uuidv4().substr(0, 8)}`,
      itemId,
      userId,
      userName,
      userPhotoURL: userPhotoURL || '',
      message,
      createdAt: new Date().toISOString()
    });

    // Notify the reporter of the item if commenter is someone else
    let item = await db.lostItems.findOne({ id: itemId });
    let isLost = true;
    if (!item) {
      item = await db.foundItems.findOne({ id: itemId });
      isLost = false;
    }

    if (item && item.reporterId !== userId) {
      await db.notifications.create({
        id: `notif-${uuidv4().substr(0, 8)}`,
        userId: item.reporterId,
        type: 'comment',
        message: `${userName} commented on your reported ${isLost ? 'lost' : 'found'} item "${item.name}": "${message.slice(0, 40)}${message.length > 40 ? '...' : ''}"`,
        relatedItemId: itemId,
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error in createItemComment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

