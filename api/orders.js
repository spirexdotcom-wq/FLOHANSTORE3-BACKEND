const mongoose = require('mongoose');

let cachedDb = null;

async function connectDB() {
    if (cachedDb) return cachedDb;
    const uri = process.env.MONGODB_URI || 'mongodb+srv://spirexdotcom_db_user:adminflohanstore3@cluster0.coeu1c2.mongodb.net/';
    const conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    cachedDb = conn;
    return conn;
}

const orderSchema = new mongoose.Schema({
    orderId: String,
    customerName: String,
    totalAmount: Number,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();

        if (req.method === 'POST') {
            const newOrder = new Order(req.body);
            await newOrder.save();
            return res.status(201).json({ success: true, message: 'Pesanan berhasil disimpan!' });
        } 
        
        if (req.method === 'GET') {
            const orders = await Order.find().sort({ createdAt: -1 });
            return res.status(200).json(orders);
        }

        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
  }
      
