const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

class Blog {
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: process.env.DB_CONNECTION_LIMIT,
      queueLimit: 0,
    });
  }

  async getAllPosts() {
    const [rows] = await this.pool.execute(`
      SELECT JSON_OBJECT(
        'token', b.token,
        'title', b.title,
        'description', b.description,
        'content', b.content,
        'author', JSON_OBJECT(
            'name', a.name,
            'email', a.email
        ),
        'imageURL', b.imageURL,
        'backgroundimg', b.backgroundimg,
        'comments', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'user', c.user,
                    'text', c.text,
                    'timestamp', DATE_FORMAT(c.timestamp, '%Y-%m-%dT%T.%fZ')
                )
            )
            FROM comments c
            WHERE c.token = b.token
        )
      ) AS json_output
      FROM blog b
      JOIN author a ON b.token = a.token
    `);
    console.log("Raw SQL output for getAllPosts:", rows);
    return rows.map((row) => JSON.parse(JSON.stringify(row.json_output)));
  }

  async getPostByToken(token) {
    const [rows] = await this.pool.execute(
      `
      SELECT JSON_OBJECT(
        'token', b.token,
        'title', b.title,
        'description', b.description,
        'content', b.content,
        'author', JSON_OBJECT(
            'name', a.name,
            'email', a.email
        ),
        'imageURL', b.imageURL,
        'backgroundimg', b.backgroundimg,
        'comments', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'user', c.user,
                    'text', c.text,
                    'timestamp', DATE_FORMAT(c.timestamp, '%Y-%m-%dT%T.%fZ')
                )
            )
            FROM comments c
            WHERE c.token = b.token
        )
      ) AS json_output
      FROM blog b
      JOIN author a ON b.token = a.token
      WHERE b.token = ?
    `,
      [token]
    );
    console.log("Raw SQL output for getPostByToken:", rows);
    return rows.length ? JSON.parse(JSON.stringify(rows[0].json_output)) : null;
  }

  async createPost(postData) {
    const token = uuidv4();
    const { title, description, content, imageURL, backgroundimg, author } =
      postData;

    // Validate required fields
    if (
      !title ||
      !description ||
      !content ||
      !author ||
      !author.name ||
      !author.email
    ) {
      console.error("Missing required fields:", {
        title,
        description,
        content,
        author,
      });
      throw new Error("Missing required fields");
    }

    // Ensure optional fields are not undefined
    const imageURLSafe = imageURL || null;
    const backgroundimgSafe = backgroundimg || null;

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "INSERT INTO blog (token, title, description, content, imageURL, backgroundimg) VALUES (?, ?, ?, ?, ?, ?)",
        [token, title, description, content, imageURLSafe, backgroundimgSafe]
      );
      await connection.execute(
        "INSERT INTO author (token, name, email) VALUES (?, ?, ?)",
        [token, author.name, author.email]
      );
      await connection.commit();
      return { token, ...postData };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updatePostByToken(token, postData) {
    const { title, description, content, imageURL, backgroundimg, author } =
      postData;

    // Validate required fields
    if (
      !title ||
      !description ||
      !content ||
      !author ||
      !author.name ||
      !author.email
    ) {
      throw new Error("Missing required fields");
    }

    // Ensure optional fields are not undefined
    const imageURLSafe = imageURL || null;
    const backgroundimgSafe = backgroundimg || null;

    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        "UPDATE blog SET title = ?, description = ?, content = ?, imageURL = ?, backgroundimg = ? WHERE token = ?",
        [title, description, content, imageURLSafe, backgroundimgSafe, token]
      );
      await connection.execute(
        "UPDATE author SET name = ?, email = ? WHERE token = ?",
        [author.name, author.email, token]
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async deletePostByToken(token) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute("DELETE FROM blog WHERE token = ?", [token]);
      await connection.execute("DELETE FROM author WHERE token = ?", [token]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async addCommentToPost(token, comment) {
    const { user, text, timestamp } = comment;

    // Validate required fields
    if (!user || !text || !timestamp) {
      throw new Error("Missing required fields");
    }

    await this.pool.execute(
      "INSERT INTO comments (token, user, text, timestamp) VALUES (?, ?, ?, ?)",
      [token, user, text, timestamp]
    );
    return comment;
  }
}

module.exports = Blog;
