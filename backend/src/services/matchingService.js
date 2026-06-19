import { db } from '../config/db.js';

const getKeywords = (text) => {
  if (!text) return new Set();
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'on', 'in', 'at', 'with', 'and', 'or', 'for', 'of', 'to', 
    'it', 'my', 'your', 'left', 'found', 'lost', 'some', 'this', 'that', 'there'
  ]);
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
  );
};

export const checkMatches = async (item, type) => {
  // If item is 'lost', we check 'found' items, and vice versa
  const targets = type === 'lost' 
    ? await db.foundItems.find() 
    : await db.lostItems.find();
    
  const users = await db.users.find();
  const matches = [];

  for (const target of targets) {
    // Only check active listings
    if (target.status !== 'Lost' && target.status !== 'Found') continue;

    let score = 0;

    // 1. Category match (heavy weight)
    const categoryMatch = item.category.toLowerCase() === target.category.toLowerCase();
    if (categoryMatch) {
      score += 0.4;
    }

    // 2. Location match
    const itemLoc = (type === 'lost' ? item.lastSeenLocation : item.locationFound) || '';
    const targetLoc = (type === 'lost' ? target.locationFound : target.lastSeenLocation) || '';
    const locationMatch = itemLoc.toLowerCase() === targetLoc.toLowerCase();
    if (locationMatch) {
      score += 0.25;
    }

    // 3. Date match (found date should be on or after lost date)
    const itemDateStr = type === 'lost' ? item.dateLost : item.dateFound;
    const targetDateStr = type === 'lost' ? target.dateFound : target.dateLost;

    if (itemDateStr && targetDateStr) {
      const lostDate = new Date(type === 'lost' ? itemDateStr : targetDateStr);
      const foundDate = new Date(type === 'lost' ? targetDateStr : itemDateStr);
      
      // Found date is on or after lost date
      if (foundDate >= lostDate) {
        score += 0.15;
      }
    }

    // 4. Description & Name overlap
    const nameKeywords1 = getKeywords(item.name);
    const nameKeywords2 = getKeywords(target.name);
    const descKeywords1 = getKeywords(item.description);
    const descKeywords2 = getKeywords(target.description);

    const keywords1 = new Set([...nameKeywords1, ...descKeywords1]);
    const keywords2 = new Set([...nameKeywords2, ...descKeywords2]);

    const intersection = [...keywords1].filter(word => keywords2.has(word));
    const union = new Set([...keywords1, ...keywords2]);

    const jaccard = union.size > 0 ? intersection.length / union.size : 0;
    score += jaccard * 0.2;

    // If score passes threshold (e.g. 0.5), we found a match
    if (score >= 0.5) {
      matches.push({
        target,
        score
      });
    }
  }

  // Trigger notifications for matches
  if (matches.length > 0) {
    const lostItem = type === 'lost' ? item : null;
    const foundItem = type === 'found' ? item : null;

    for (const { target } of matches) {
      const currentLost = lostItem || target;
      const currentFound = foundItem || target;

      const reporterLostId = currentLost.reporterId;
      const reporterFoundId = currentFound.reporterId;

      // Don't match if it's the same reporter (reported both lost and found)
      if (reporterLostId === reporterFoundId) continue;

      const lostUser = users.find(u => u.uid === reporterLostId);
      const foundUser = users.find(u => u.uid === reporterFoundId);

      const lostUserName = lostUser ? lostUser.name : 'Someone';
      const foundUserName = foundUser ? foundUser.name : 'Someone';

      // Notify the person who lost it
      await db.notifications.create({
        id: `notif-${Date.now()}-lost-${Math.random().toString(36).substr(2, 5)}`,
        userId: reporterLostId,
        type: 'match',
        message: `AI Match: ${foundUserName} found a '${currentFound.name}' at ${currentFound.locationFound} which matches your lost '${currentLost.name}'!`,
        relatedItemId: currentFound.id,
        read: false,
        createdAt: new Date().toISOString()
      });

      // Notify the person who found it
      await db.notifications.create({
        id: `notif-${Date.now()}-found-${Math.random().toString(36).substr(2, 5)}`,
        userId: reporterFoundId,
        type: 'match',
        message: `AI Match: ${lostUserName} lost a '${currentLost.name}' which matches the '${currentFound.name}' you found at ${currentFound.locationFound}!`,
        relatedItemId: currentLost.id,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  return matches;
};
