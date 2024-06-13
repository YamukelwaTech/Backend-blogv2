const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");
const { format } = require("date-fns");
require("dotenv").config();
const fs = require("fs").promises;

class Blog {
  constructor() {
    this.pool = mysql.createPool({
      host: "127.0.0.1",
      user: "root",
      password: "mango22",
      database: "blog_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  async testConnection() {
    try {
      const connection = await this.pool.getConnection();
      console.log("Connected to the database successfully!");
      await connection.release();
    } catch (err) {
      console.error("Failed to connect to the database:", err);
    }
  }

  async getAllPosts() {
    try {
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
      return rows.map((row) => JSON.parse(JSON.stringify(row.json_output)));
    } catch (err) {
      console.error("Error in getAllPosts:", err);
      throw new Error("Failed to fetch posts");
    }
  }

  async getPostByToken(token) {
    try {
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
      return rows.length
        ? JSON.parse(JSON.stringify(rows[0].json_output))
        : null;
    } catch (err) {
      console.error("Error in getPostByToken:", err);
      throw new Error("Failed to fetch post by token");
    }
  }

  async createPost(postData) {
    const token = uuidv4();
    const { title, description, content, imageURL, backgroundimg, author } =
      postData;
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
      console.error("Error in createPost:", err);
      throw new Error("Failed to create post");
    } finally {
      connection.release();
    }
  }

  async updatePostByToken(token, postData) {
    const { title, description, content, imageURL, backgroundimg, author } =
      postData;
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
      console.error("Error in updatePostByToken:", err);
      throw new Error("Failed to update post");
    } finally {
      connection.release();
    }
  }

  async deletePostByToken(token) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      await this.deleteCommentFromPost(token);
      const [postRows] = await connection.execute(
        "SELECT imageURL, backgroundimg FROM blog WHERE token = ?",
        [token]
      );
      if (postRows.length > 0) {
        const { imageURL, backgroundimg } = postRows[0];
        if (imageURL) {
          await this.deleteImage(`./assets/faces/${imageURL.split("/").pop()}`);
        }
        if (backgroundimg) {
          await this.deleteImage(`./assets/${backgroundimg.split("/").pop()}`);
        }
      }
      const [authorRows] = await connection.execute(
        "SELECT token FROM author WHERE token = ?",
        [token]
      );
      const authorExists = authorRows.length > 0;
      if (authorExists) {
        const [otherPostsRows] = await connection.execute(
          "SELECT token FROM blog WHERE token != ? AND token IN (SELECT token FROM author WHERE token = ?)",
          [token, token]
        );
        const otherPostsExist = otherPostsRows.length > 0;
        if (otherPostsExist) {
          await connection.execute(
            "UPDATE author SET token = NULL WHERE token = ?",
            [token]
          );
        } else {
          await connection.execute("DELETE FROM author WHERE token = ?", [
            token,
          ]);
        }
      }
      await connection.execute("DELETE FROM blog WHERE token = ?", [token]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error("Error in deletePostByToken:", error);
      throw new Error("Failed to delete post");
    } finally {
      connection.release();
    }
  }

  async deleteImage(imagePath) {
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      console.error(`Failed to delete image: ${imagePath}`, error);
    }
  }

  async addCommentToPost(token, comment) {
    const { user, text, timestamp } = comment;
    if (!user || !text || !timestamp) {
      throw new Error("Missing required fields");
    }
    const formattedTimestamp = format(
      new Date(timestamp),
      "yyyy-MM-dd HH:mm:ss"
    );
    try {
      await this.pool.execute(
        "INSERT INTO comments (token, user, text, timestamp) VALUES (?, ?, ?, ?)",
        [token, user, text, formattedTimestamp]
      );
      return { ...comment, timestamp: formattedTimestamp };
    } catch (err) {
      console.error("Error in addCommentToPost:", err);
      throw new Error("Failed to add comment");
    }
  }

  async deleteCommentFromPost(token) {
    try {
      await this.pool.execute("DELETE FROM comments WHERE token = ?", [token]);
    } catch (err) {
      console.error("Error in deleteCommentFromPost:", err);
      throw new Error("Failed to delete comments");
    }
  }
}

const blog = new Blog();
blog.testConnection();

module.exports = Blog;
