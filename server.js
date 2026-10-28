const express = require('express'); 
const crypto = require('crypto');
const cors = require('cors');
const midtransClient = require('midtrans-client');
const mongoose = require('mongoose'); // Di-require dengan benar menggunakan huruf kecil 'const'

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === KONEKSI MONGODB (Ditempatkan aman di sini) ===
mongoose.connect('mongodb+srv://spirexdotcom_db_user:adminflohanstore3@cluster0.coeu1c2.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Terhubung dengan Aman!');
}).catch(err => {
  console.error('Koneksi MongoDB Gagal:', err);
});

let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

app.get('/', (req, res) => {
    res.send('Backend Flohan Store Aktif dan Stabil!');
});

app.post('/api/create-transaction', async (req, res) => {
    try {
        const { order_id, gross_amount, customer_details, item_details } = req.body;

        let parameter = {
            transaction_details: {
                order_id: order_id || `FLOHAN-${Date.now()}`,
                gross_amount: gross_amount
            },
            customer_details: customer_details || {
                first_name: "Pelanggan Flohan",
                email: "pelanggan@example.com",
                phone: "08123456789"
            },
            item_details: item_details || []
        };

        const transaction = await snap.createTransaction(parameter);
        res.json({
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });

    } catch (error) {
        console.error("Gagal membuat transaksi:", error);
        res.status(500).json({ error: error.message || JSON.stringify(error) });
    }
});

// Endpoint untuk Membuat Transaksi iPaymu (ASLI TANPA DIUBAH)
app.post('/api/ipaymu/create-transaction', async (req, res) => {
    try {
        const { order_id, gross_amount, customer_details, item_details } = req.body;

        const va = process.env.IPAYMU_VA; 
        const apiKey = process.env.IPAYMU_API_KEY;
        const isProduction = false; 
        
        const baseUrl = isProduction ? 'https://my.ipaymu.com/api/v2/payment' : 'https://sandbox.ipaymu.com/api/v2/payment';

        const productName = item_details && item_details.length > 0 ? item_details.map(item => item.name) : ['Produk Flohan Store'];
        const productQty = item_details && item_details.length > 0 ? item_details.map(item => item.quantity) : [1];
        const productPrice = item_details && item_details.length > 0 ? item_details.map(item => item.price) : [gross_amount];

        const body = {
            product: productName,
            qty: productQty,
            price: productPrice,
            returnUrl: 'https://spirexdotcom-wq.github.io/flohanstore3/', 
            cancelUrl: 'https://spirexdotcom-wq.github.io/flohanstore3/', 
            notifyUrl: 'https://flohanstore3-backend.vercel.app/api/ipaymu/callback', 
            referenceId: order_id || `FLOHAN-IPAYMU-${Date.now()}`,
            buyerName: customer_details ? customer_details.first_name : 'Pelanggan Flohan',
            buyerPhone: customer_details ? customer_details.phone : '08123456789',
            buyerEmail: customer_details && customer_details.email ? customer_details.email : 'pelanggan@example.com',
            format: 'json'
        };

        const jsonBody = JSON.stringify(body);
        const hashBody = crypto.createHash('sha256').update(jsonBody).digest('hex');
        const stringToSign = `POST:${va}:${hashBody}:${apiKey}`;
        const signature = crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex');

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'signature': signature,
                'va': va
            },
            body: jsonBody
        });

        const result = await response.json();
        console.log("Response iPaymu:", result);

        if (result.Success && result.Data && result.Data.Url) {
            res.json({
                success: true,
                paymentUrl: result.Data.Url,
                sessionId: result.Data.SessionID
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: result.Message || 'Gagal membuat transaksi iPaymu' 
            });
        }

    } catch (error) {
        console.error("Gagal transaksi iPaymu:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
            
// Skema Pesanan untuk Database & Admin
const orderSchema = new mongoose.Schema({
  orderId: String,
  customerName: String,
  totalAmount: Number,
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// API untuk Menerima Pesanan Baru
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json({ message: 'Pesanan berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API untuk Mengambil Semua Pesanan ke Halaman Admin
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
        
