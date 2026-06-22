import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
dotenv.config(); 
dns.setDefaultResultOrder('ipv4first');

import apiRoutes from './routes/api.js'; 

const app = express();


app.use(
  cors({
    origin: [
      "http://localhost:5173", process.env.CLIENT_URL   ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());


app.use('/api/v1', apiRoutes);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected securely (No separate Section Schema).'))
  .catch((err) => console.error('Database connection error:', err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`ES Module server handling single section on port ${PORT}`));