import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getJsonFilePath = (filename) => path.join(DATA_DIR, filename);

const readJsonFile = (filename) => {
  try {
    const data = fs.readFileSync(getJsonFilePath(filename), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeJsonFile = (filename, data) => {
  fs.writeFileSync(getJsonFilePath(filename), JSON.stringify(data, null, 2), 'utf8');
};

// Check if MONGODB_URI is provided
const isMongoConfigured = !!process.env.MONGODB_URI;

// Initialize MongoDB Connection
export const connectDB = async () => {
  if (isMongoConfigured) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB Connected successfully.');
    } catch (error) {
      console.error('MongoDB Connection failed. Falling back to local JSON database.', error);
    }
  } else {
    console.log('Using local JSON file-based database (MONGODB_URI missing).');
  }
};

// MONGODB SCHEMAS
const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  email: { type: String, required: true },
  photoURL: { type: String, default: '' },
  role: { type: String, default: 'student' },
  points: { type: Number, default: 0 },
  contactNumber: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const LostItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reporterId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  lastSeenLocation: { type: String, required: true },
  dateLost: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  contactNumber: { type: String, default: '' },
  status: { type: String, default: 'Lost' },
  createdAt: { type: Date, default: Date.now }
});

const FoundItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reporterId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  locationFound: { type: String, required: true },
  dateFound: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  additionalNotes: { type: String, default: '' },
  status: { type: String, default: 'Found' },
  createdAt: { type: Date, default: Date.now }
});

const ClaimSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  lostItemId: { type: String, default: '' },
  foundItemId: { type: String, required: true },
  claimantId: { type: String, required: true },
  finderId: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  relatedItemId: { type: String, default: '' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  itemId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userPhotoURL: { type: String, default: '' },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const LostItemModel = mongoose.models.LostItem || mongoose.model('LostItem', LostItemSchema);
const FoundItemModel = mongoose.models.FoundItem || mongoose.model('FoundItem', FoundItemSchema);
const ClaimModel = mongoose.models.Claim || mongoose.model('Claim', ClaimSchema);
const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const CommentModel = mongoose.models.Comment || mongoose.model('Comment', CommentSchema);

// ADAPTER PATTERN HELPER GENERATOR
const makeAdapter = (filename, Model) => {
  return {
    find: async (query = {}) => {
      if (mongoose.connection.readyState === 1) {
        return await Model.find(query).lean();
      } else {
        const data = readJsonFile(filename);
        return data.filter(item => {
          return Object.keys(query).every(key => {
            return item[key] === query[key];
          });
        });
      }
    },

    findOne: async (query = {}) => {
      if (mongoose.connection.readyState === 1) {
        return await Model.findOne(query).lean();
      } else {
        const data = readJsonFile(filename);
        return data.find(item => {
          return Object.keys(query).every(key => {
            return item[key] === query[key];
          });
        }) || null;
      }
    },

    create: async (doc) => {
      if (mongoose.connection.readyState === 1) {
        const newDoc = new Model(doc);
        await newDoc.save();
        return newDoc.toObject();
      } else {
        const data = readJsonFile(filename);
        data.push(doc);
        writeJsonFile(filename, data);
        return doc;
      }
    },

    updateOne: async (query, updateFields) => {
      if (mongoose.connection.readyState === 1) {
        return await Model.findOneAndUpdate(query, { $set: updateFields }, { new: true }).lean();
      } else {
        const data = readJsonFile(filename);
        const item = data.find(item => {
          return Object.keys(query).every(key => {
            return item[key] === query[key];
          });
        });
        if (item) {
          Object.assign(item, updateFields);
          writeJsonFile(filename, data);
          return item;
        }
        return null;
      }
    },

    deleteOne: async (query) => {
      if (mongoose.connection.readyState === 1) {
        return await Model.deleteOne(query);
      } else {
        let data = readJsonFile(filename);
        const initialLength = data.length;
        data = data.filter(item => {
          return !Object.keys(query).every(key => {
            return item[key] === query[key];
          });
        });
        writeJsonFile(filename, data);
        return { deletedCount: initialLength - data.length };
      }
    }
  };
};

export const db = {
  users: makeAdapter('users.json', UserModel),
  lostItems: makeAdapter('lost_items.json', LostItemModel),
  foundItems: makeAdapter('found_items.json', FoundItemModel),
  claims: makeAdapter('claims.json', ClaimModel),
  notifications: makeAdapter('notifications.json', NotificationModel),
  comments: makeAdapter('comments.json', CommentModel)
};
