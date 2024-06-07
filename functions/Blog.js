const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

class Blog {
  constructor(filePath) {
    this.filePath = filePath;
  }

  readPostsFromFile(callback) {
    fs.readFile(this.filePath, "utf8", (err, data) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null, JSON.parse(data));
    });
  }

  writePostsToFile(posts, callback) {
    fs.writeFile(
      this.filePath,
      JSON.stringify(posts, null, 2),
      "utf8",
      (err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null);
      }
    );
  }

  getAllPosts(callback) {
    this.readPostsFromFile(callback);
  }

  getPostByToken(token, callback) {
    this.readPostsFromFile((err, posts) => {
      if (err) {
        callback(err);
        return;
      }
      const post = posts.find((post) => post.token === token);
      if (!post) {
        callback(new Error("Post not found"), null);
        return;
      }
      callback(null, post);
    });
  }

  createPost(post, callback) {
    const token = uuidv4();
    post.token = token;

    post.title = post.title || "Default Title";
    post.description = post.description || "Default Description";
    post.content = post.content || "Default Content";
    post.author = post.author || {
      name: "Unknown",
      email: "unknown@example.com",
    };
    post.imageURL = post.imageURL || null;
    post.backgroundimg = post.backgroundimg || null;
    post.comments = post.comments || [];

    this.readPostsFromFile((err, posts) => {
      if (err) {
        callback(err);
        return;
      }

      posts.push(post);

      this.writePostsToFile(posts, (err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, post);
      });
    });
  }

  updatePostByToken(token, updatedPostData, callback) {
    this.readPostsFromFile((err, posts) => {
      if (err) {
        callback(err);
        return;
      }
      const updatedPosts = posts.map((post) => {
        if (post.token === token) {
          return { ...post, ...updatedPostData };
        }
        return post;
      });
      this.writePostsToFile(updatedPosts, (err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null);
      });
    });
  }

  deletePostByToken(token, callback) {
    this.getPostByToken(token, (err, post) => {
      if (err) {
        callback(new Error("Post not found"));
        return;
      }
      this.readPostsFromFile((err, posts) => {
        if (err) {
          callback(err);
          return;
        }
        const updatedPosts = posts.filter((post) => post.token !== token);
        this.writePostsToFile(updatedPosts, (err) => {
          if (err) {
            callback(err);
            return;
          }
          callback(null);
        });
      });
    });
  }

  addCommentToPost(token, comment, callback) {
    this.readPostsFromFile((err, posts) => {
      if (err) {
        callback(err);
        return;
      }
      const post = posts.find((post) => post.token === token);
      if (!post) {
        callback(new Error("Post not found"));
        return;
      }
      post.comments.push(comment);
      this.writePostsToFile(posts, (err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, comment);
      });
    });
  }
}

module.exports = Blog;
