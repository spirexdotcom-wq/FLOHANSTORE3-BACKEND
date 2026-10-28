const express = require('express');
const cors = require('cors');
const midtransClient = require('midtrans-client');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
    
