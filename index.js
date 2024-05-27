const express = require('express');
const bodyParser = require('body-parser');
const {createClient} = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase credentials
const SUPABASE_URL = 'https://mgbmlagwujsehfqxbfzw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYm1sYWd3dWpzZWhmcXhiZnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY1NDY3MTYsImV4cCI6MjAzMjEyMjcxNn0.-a-ZtjJeu-7w2v78xt-3p9vEqsLpVSG0f7HB0z-vOQQ';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// CORS middleware
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}
);

// GET endpoint for fetching data by date
app.get('/query', async(req,res)=>{
    const date = req.query.date;
    try {
        const {data, error} = await supabase.from('data_table').select('*').eq('date', date);
        if (error) {
            throw error;
        }
        res.status(200).json({
            data
        });
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({
            error: 'Error fetching data from Supabase'
        });
    }
}
);

// GET endpoint for fetching data by ID
app.get('/queryById', async(req,res)=>{
    const id = req.query.id;
    try {
        const {data, error} = await supabase.from('data_table').select('*').eq('id', id);
        if (error) {
            throw error;
        }
        res.status(200).json({
            data: data[0]
        });
    } catch (error) {
        console.error('Error fetching data by ID:', error.message);
        res.status(500).json({
            error: 'Error fetching data from Supabase'
        });
    }
}
);

// POST endpoint for adding data
app.post('/add', async(req,res)=>{
    const {date, account, site, name, itemName, duration, price, paymentMethod, isPurchased, purchaseAmount, purchaseAccount, transactionId, purchaseTeam, wallet} = req.body;
    try {
        const {data, error} = await supabase.from('data_table').insert([{
            date,
            account,
            site,
            name,
            item_name: itemName,
            duration,
            price,
            payment_method: paymentMethod,
            is_purchased: isPurchased === true,
            // Ensure boolean value
            purchase_amount: purchaseAmount,
            purchase_account: purchaseAccount,
            transaction_id: transactionId,
            purchase_team: purchaseTeam,
            wallet
        }]);
        if (error) {
            throw error;
        }
        res.status(201).json({
            message: 'Data added successfully'
        });
    } catch (error) {
        console.error('Error adding data:', error.message);
        res.status(500).json({
            error: 'Error adding data to Supabase'
        });
    }
}
);

// PUT endpoint for updating data
app.put('/edit', async(req,res)=>{
    const {id, isPurchased, purchaseAmount, purchaseAccount, transactionId, purchaseTeam, wallet} = req.body;
    try {
        const {data, error} = await supabase.from('data_table').update({
            is_purchased: isPurchased === true,
            // Ensure boolean value
            purchase_amount: purchaseAmount,
            purchase_account: purchaseAccount,
            transaction_id: transactionId,
            purchase_team: purchaseTeam,
            wallet
        }).eq('id', id);
        if (error) {
            throw error;
        }
        res.status(200).json({
            message: 'Data updated successfully'
        });
    } catch (error) {
        console.error('Error updating data:', error.message);
        res.status(500).json({
            error: 'Error updating data in Supabase'
        });
    }
}
);

// DELETE endpoint for deleting data
app.delete('/delete', async(req,res)=>{
    const {id} = req.body;
    try {
        if (!id) {
            throw new Error('ID is required');
        }
        const {data, error} = await supabase.from('data_table').delete().eq('id', id);
        if (error) {
            throw error;
        }
        res.status(200).json({
            message: 'Data deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting data:', error.message);
        res.status(500).json({
            error: 'Error deleting data from Supabase'
        });
    }
}
);

// Start the server
app.listen(PORT, ()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
}
);
