const mysql = require("mysql2/promise");
require("dotenv").config();

const testConnection = async () => {
  const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: process.env.DB_PASSWORD,
    database: "blog_db",
    waitForConnections: true,
    connectionLimit: 10,
    port: 3306,
    queueLimit: 0,
  });

  try {
    const connection = await pool.getConnection();
    console.log("Connected to the database successfully!");
    await connection.release();
  } catch (err) {
    console.error("Failed to connect to the database:", err);
  } finally {
    pool.end(); // Close the connection pool
  }
};

testConnection();
