const express = require('express');
const bodyParser = require('body-parser');
const {createClient} = require('@supabase/supabase-js');
const xlsx = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase credentials
const SUPABASE_URL = 'https://mgbmlagwujsehfqxbfzw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYm1sYWd3dWpzZWhmcXhiZnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY1NDY3MTYsImV4cCI6MjAzMjEyMjcxNn0.-a-ZtjJeu-7w2v78xt-3p9vEqsLpVSG0f7HB0z-vOQQ';

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
    const {date} = req.query;
    console.log('Received Date:', date);
    if (!date) {
        return res.status(400).json({
            error: 'Date parameter is required'
        });
    }
    try {
        const {data, error} = await supabase.from('data_table').select('*').eq('date', date);
        if (error)
            throw error;
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
    const {id} = req.query;
    try {
        const {data, error} = await supabase.from('data_table').select('*').eq('id', id);
        if (error)
            throw error;
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
    const newData = req.body;
    try {
        const {data, error} = await supabase.from('data_table').insert([newData]);
        if (error)
            throw error;
        res.status(201).json({
            data
        });
    } catch (error) {
        console.error('Error adding data:', error.message);
        res.status(500).json({
            error: 'Error adding data to Supabase'
        });
    }
}
);

// PUT endpoint for editing data
app.put('/edit', async(req,res)=>{
    const updatedData = req.body;
    try {
        const {data, error} = await supabase.from('data_table').update(updatedData).eq('id', updatedData.id);
        if (error)
            throw error;
        res.status(200).json({
            data
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
        const {data, error} = await supabase.from('data_table').delete().eq('id', id);
        if (error)
            throw error;
        res.status(200).json({
            data
        });
    } catch (error) {
        console.error('Error deleting data:', error.message);
        res.status(500).json({
            error: 'Error deleting data from Supabase'
        });
    }
}
);

// Endpoint for downloading data as an Excel file
app.get('/download', async(req,res)=>{
    const {date} = req.query;
    try {
        const {data, error} = await supabase.from('data_table').select('*').eq('date', date);
        if (error)
            throw error;

        // Map the data to the desired format
        const formattedData = data.map(item=>({
            '日期': item.date,
            '账号': item.account,
            '站点': item.site,
            '姓名': item.name,
            '名称': item.itemName,
            '挂单时长': item.duration,
            '出售金额': item.price,
            '收款方式': item.paymentMethod,
            '是否购买': item.isPurchased ? '是' : '否',
            '购买金额': item.purchaseAmount,
            '购买账号': item.purchaseAccount,
            '流水单号': item.transactionId,
            '购买团队': item.purchaseTeam,
            '钱包': item.wallet
        }));

        // Create a worksheet with the specified headers
        const worksheet = xlsx.utils.json_to_sheet(formattedData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
        const excelBuffer = xlsx.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx'
        });

        res.setHeader('Content-Disposition', `attachment; filename=data_${date}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error downloading data:', error.message);
        res.status(500).json({
            error: 'Error downloading data from Supabase'
        });
    }
}
);

// Serve static files
app.use(express.static('public'));

// Start the server
app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
}
);
