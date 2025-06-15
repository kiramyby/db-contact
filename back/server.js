const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors'); // Import the cors middleware
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: '',
    port: 3306,
    user: 'root',
    password: 'root123',
    database: 'hospital_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

app.post('/api/execute-sql', async (req, res) => {
    const { sql } = req.body;

    if (!sql) {
        return res.status(400).json({ error: 'SQL statement is required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [results, fields] = await connection.execute(sql);
        res.json({ results, fields });
    } catch (error) {
        console.error('Error executing SQL:', error);
        res.status(500).json({ error: 'Failed to execute SQL statement', details: error.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// Basic error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Basic error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
