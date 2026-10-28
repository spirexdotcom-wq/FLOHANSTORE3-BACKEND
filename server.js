const express = require('express'); const crypto = require('crypto');
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
// Endpoint untuk Membuat Transaksi iPaymu
app.post('/api/ipaymu/create-transaction', async (req, res) => {
    try {
        const { order_id, gross_amount, customer_details, item_details } = req.body;

        const va = process.env.IPAYMU_VA; 
        const apiKey = process.env.IPAYMU_API_KEY;
        const isProduction = false; // Karena menggunakan akun Sandbox iPaymu
        
        // URL Endpoint Sandbox iPaymu v2 yang benar
        const baseUrl = isProduction ? 'https://my.ipaymu.com/api/v2/payment' : 'https://sandbox.ipaymu.com/api/v2/payment';

        // Menyiapkan data produk sesuai format array iPaymu v2
        const productName = item_details && item_details.length > 0 ? item_details.map(item => item.name) : ['Produk Flohan Store'];
        const productQty = item_details && item_details.length > 0 ? item_details.map(item => item.quantity) : [1];
        const productPrice = item_details && item_details.length > 0 ? item_details.map(item => item.price) : [gross_amount];

        const body = {
            product: productName,
            qty: productQty,
            price: productPrice,
            returnUrl: 'https://spirexdotcom-wq.github.io/flohanstore3/', 
            cancelUrl: 'https://spirexdotcom-wq.github.io/flohanstore3/', 
            notifyUrl: 'https://flohanstore-3-backend.vercel.app/api/ipaymu/callback', 
            referenceId: order_id || `FLOHAN-IPAYMU-${Date.now()}`,
            buyerName: customer_details ? customer_details.first_name : 'Pelanggan Flohan',
            buyerPhone: customer_details ? customer_details.phone : '08123456789',
            buyerEmail: customer_details && customer_details.email ? customer_details.email : 'pelanggan@example.com',
            format: 'json'
        };

        // Signature Generation untuk iPaymu v2
        const jsonBody = JSON.stringify(body);
        const hashBody = crypto.createHash('sha256').update(jsonBody).digest('hex');
        const stringToSign = `POST:${va}:${hashBody}:${apiKey}`;
        const signature = crypto.createHmac('sha256', apiKey).update(stringToSign).digest('hex');

        // Request ke API iPaymu
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
            

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
    
