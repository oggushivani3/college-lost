import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (one level up from src/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Also try project root .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server and deployed Vercel app
app.use(cors({
  origin: ['http://localhost:5173', 'https://college-lost.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());



// Mount API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date(), db: 'MongoDB Atlas' });
});

// Connect to DB then start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  College Lost & Found API Server Running      `);
    console.log(`  Port: ${PORT}                                `);
    console.log(`  Endpoint: http://localhost:${PORT}          `);
    console.log(`  Database: MongoDB Atlas                      `);
    console.log(`===============================================`);
  });
};

startServer();
