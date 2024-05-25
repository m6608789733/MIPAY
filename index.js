const express = require('express');
const cors = require('cors');
const {createClient} = require('@supabase/supabase-js');
const requestIp = require('request-ip');
const path = require('path');

const app = express();
const port = process.env.PORT || 3010;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://mgbmlagwujsehfqxbfzw.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYm1sYWd3dWpzZWhmcXhiZnp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY1NDY3MTYsImV4cCI6MjAzMjEyMjcxNn0.-a-ZtjJeu-7w2v78xt-3p9vEqsLpVSG0f7HB0z-vOQQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestIp.mw());

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Logging middleware
app.use((req,res,next)=>{
    const clientIp = requestIp.getClientIp(req);
    const useragent = req.headers['user-agent'];
    const requestpath = req.path;
    const devicetype = useragent.includes('Mobile') ? '手机' : '电脑';

    // Exclude specific paths from logging
    if (requestpath === '/dashboard' || requestpath === '/dashboard/logs') {
        next();
        return;
    }

    const requestData = {
        ip: clientIp,
        useragent: useragent,
        requestpath: requestpath,
        devicetype: devicetype,
        createdat: new Date()
    };

    supabase.from('request_logs').insert([requestData]).then(({data, error})=>{
        if (error) {
            console.error('插入请求日志时出错：', error.message);
        } else {
            console.log('请求日志已记录：', data);
        }
    }
    );

    next();
}
);

// Dashboard route
app.get('/dashboard', async(req,res)=>{
    try {
        const {data: logs, error} = await supabase.from('request_logs').select('*');

        if (error) {
            throw new Error('无法检索请求日志：' + error.message);
        }

        res.render('dashboard', {
            logs
        });
    } catch (error) {
        res.status(500).json({
            code: -1,
            message: '内部服务器错误',
            error: error.message
        });
    }
}
);

// Get users with optional date filter
app.get('/dashboard/logs', async(req,res)=>{
    try {
        const {data, error} = await supabase.from('request_logs').select('*');

        if (error) {
            throw new Error('Failed to fetch logs: ' + error.message);
        }

        res.json({
            logs: data
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
}
);

// Routes for managing data
app.get('/users', getUsers);
app.post('/api/addData', addData);
app.post('/api/updateData', updateData);
app.post('/api/deleteData', deleteData);

// Error handling middleware
app.use((err,req,res,next)=>{
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message
    });
}
);

// Start server
app.listen(port, ()=>{
    console.log(`服务器正在该端口运行 ${port}`);
}
);

// Helper functions
async function getUsers(req, res) {
    try {
        const selectedDate = req.query.date;
        let query = supabase.from('mipay').select('*');

        if (selectedDate) {
            query = query.eq('date', selectedDate);
        }

        const {data, error} = await query;

        if (error) {
            throw new Error(error.message);
        }

        res.json({
            code: 0,
            message: '成功',
            data: data
        });
    } catch (error) {
        next(error);
    }
}

async function addData(req, res, next) {
    try {
        const newData = req.body;
        const {data, error} = await supabase.from('mipay').insert([newData]);

        if (error) {
            throw new Error(error.message);
        }

        res.json({
            code: 0,
            message: '数据添加成功',
            data: data
        });
    } catch (error) {
        next(error);
    }
}

async function updateData(req, res, next) {
    try {
        const updatedData = req.body;
        const {data, error} = await supabase.from('mipay').upsert([updatedData]);

        if (error) {
            throw new Error(error.message);
        }

        res.json({
            code: 0,
            message: '数据更新成功',
            data: data
        });
    } catch (error) {
        next(error);
    }
}

async function deleteData(req, res, next) {
    try {
        const {id} = req.body;
        const {data, error} = await supabase.from('mipay').delete().eq('id', id);

        if (error) {
            throw new Error(error.message);
        }

        res.json({
            code: 0,
            message: '数据删除成功',
            data: data
        });
    } catch (error) {
        next(error);
    }
}
