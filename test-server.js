
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Simple event schema
const eventSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  start_Date: Date,
  finish_Date: Date,
  status: String,
  discountPrice: Number,
  stock: Number,
  shopId: String,
  shop: Object,
  sold_out: Number,
  createdAt: Date,
});

const Event = mongoose.model('event', eventSchema);

// Connect to database
mongoose.connect('mongodb://localhost:27017/multivendor')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test endpoint
app.get('/api/event/admin-all-events', async (req, res) => {
  try {
    console.log('Fetching all events...');
    const events = await Event.find().sort({ createdAt: -1 });
    console.log(`Found ${events.length} events`);
    
    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
