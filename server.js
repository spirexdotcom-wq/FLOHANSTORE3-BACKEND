const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inisialisasi Midtrans Snap API (mengambil kunci secara aman dari pengaturan Render)
let snap = new midtransClient.Snap({
    isProduction: false, // Ubah ke true jika sudah menggunakan akun Midtrans Asli/Live
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Endpoint Cek Server
app.get('/', (req, res) => {
    res.send('Backend Flohan Store Aktif dan Stabil!');
});

// Endpoint untuk Membuat Transaksi Midtrans
app.post('/api/create-transaction', async (req, res) => {
    try {
        const { orderId, grossAmount, customerDetails, itemDetails } = req.body;

        let parameter = {
            transaction_details: {
                order_id: orderId || `FLOHAN-${Date.now()}`,
                gross_amount: grossAmount
            },
            customer_details: customerDetails || {
                first_name: "Pelanggan Flohan",
                email: "pelanggan@example.com",
                phone: "08123456789"
            },
            item_details: itemDetails || []
        };

        const transaction = await snap.createTransaction(parameter);
        res.json({
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });

} catch (error) {
    console.error("Gagal membuat transaksi:", error.ApiResponse || error.message || error);
    res.status(500).json({ error: error.ApiResponse ? JSON.stringify(error.ApiResponse) : error.message });
}


// Menggunakan process.env.PORT yang disediakan oleh Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
