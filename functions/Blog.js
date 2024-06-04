const fs = require("fs"); // Module to work with the file system
const { v4: uuidv4 } = require('uuid'); // Module to generate unique identifiers

// Define the Blog class
class Blog {
  /**
   * Constructor to initialize a Blog object
   * @param {string} filePath - The path to the file where blog posts are stored.
   */
  constructor(filePath) {
    this.filePath = filePath; // File path to store blog posts
  }

  /**
   * Reads posts from the file
   * @param {function} callback - Callback function to handle the response.
   */
  readPostsFromFile(callback) {
    fs.readFile(this.filePath, "utf8", (err, data) => {
      if (err) {
        callback(err); // If there's an error reading the file, pass the error to the callback
        return;
      }
      callback(null, JSON.parse(data)); // Parse the file data and pass it to the callback
    });
  }

  /**
   * Writes posts to the file
   * @param {Array} posts - The array of posts to write to the file.
   * @param {function} callback - Callback function to handle the response.
   */
  writePostsToFile(posts, callback) {
    fs.writeFile(this.filePath, JSON.stringify(posts, null, 2), "utf8", (err) => {
      if (err) {
        callback(err); // If there's an error writing to the file, pass the error to the callback
        return;
      }
      callback(null); // If successful, pass null to the callback
    });
  }

  /**
   * Retrieves all posts
   * @param {function} callback - Callback function to handle the response.
   */
  getAllPosts(callback) {
    this.readPostsFromFile(callback); // Read all posts from the file
  }

  /**
   * Retrieves a post by its token
   * @param {string} token - The unique token of the post.
   * @param {function} callback - Callback function to handle the response.
   */
  getPostByToken(token, callback) {
    this.readPostsFromFile((err, posts) => {
      if (err) {
        callback(err); // If there's an error reading the file, pass the error to the callback
        return;
      }
      const post = posts.find((post) => post.token === token); // Find the post with the matching token
      if (!post) {
        callback(new Error("Post not found"), null); // If post is not found, pass an error to the callback
        return;
      }
      callback(null, post); // If post is found, pass it to the callback
    });
  }

  /**
   * Creates a new post
   * @param {Object} post - The post object to create.
   * @param {function} callback - Callback function to handle the response.
   */
  createPost(post, callback) {
    const token = uuidv4(); // Generate a unique token for the post
    post.token = token; // Assign the token to the post

    // Set default values if properties are missing
    post.title = post.title || "Default Title";
    post.description = post.description || "Default Description";
    post.content = post.content || "Default Content";
    post.author = post.author || { name: "Unknown", email: "unknown@example.com" };
    post.imageURL = post.imageURL || null;
    post.backgroundimg = post.backgroundimg || null;
    post.comments = post.comments || [];

    // Read the existing posts from the file
    this.readPostsFromFile((err, posts) => {
      if (err) {
        callback(err); 
        return;
      }

      posts.push(post); // Add the new post to the array of posts

      // Write the updated posts array to the file
      this.writePostsToFile(posts, (err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null, post); // If successful, pass the new post to the callback
      });
    });
  }

  /**
   * Updates a post by its token
   * @param {string} token - The unique token of the post to update.
   * @param {Object} updatedPostData - The updated post data.
   * @param {function} callback - Callback function to handle the response.
   */
  updatePostByToken(token, updatedPostData, callback) {
    // Read the existing posts from the file
    this.readPostsFromFile((err, posts) => {
      if (err) {
        callback(err); // If there's an error reading the file, pass the error to the callback
        return;
      }
      // Update the post with the matching token
      const updatedPosts = posts.map((post) => {
        if (post.token === token) {
          return { ...post, ...updatedPostData };
        }
        return post;
      });
      // Write the updated posts array to the file
      this.writePostsToFile(updatedPosts, (err) => {
        if (err) {
          callback(err); // If there's an error writing to the file, pass the error to the callback
          return;
        }
        callback(null); // If successful, pass null to the callback
      });
    });
  }

  /**
   * Deletes a post by its token
   * @param {string} token - The unique token of the post to delete.
   * @param {function} callback - Callback function to handle the response.
   */
  deletePostByToken(token, callback) {
    // First, check if the post exists before attempting to delete it
    this.getPostByToken(token, (err, post) => {
      if (err) {
        callback(new Error("Post not found")); // If there's an error or post is not found, pass an error to the callback
        return;
      }
      // Read the existing posts from the file
      this.readPostsFromFile((err, posts) => {
        if (err) {
          callback(err); // If there's an error reading the file, pass the error to the callback
          return;
        }
        // Filter out the post with the matching token
        const updatedPosts = posts.filter((post) => post.token !== token);
        // Write the updated posts array to the file
        this.writePostsToFile(updatedPosts, (err) => {
          if (err) {
            callback(err); // If there's an error writing to the file, pass the error to the callback
            return;
          }
          callback(null); // If successful, pass null to the callback
        });
      });
    });
  }

  /**
   * Adds a comment to a post by its token
   * @param {string} token - The unique token of the post to add a comment to.
   * @param {Object} comment - The comment object to add.
   * @param {function} callback - Callback function to handle the response.
   */
  addCommentToPost(token, comment, callback) {
    // Read the existing posts from the file
    this.readPostsFromFile((err, posts) => {
      if (err) {
        callback(err); // If there's an error reading the file, pass the error to the callback
        return;
      }
      const post = posts.find((post) => post.token === token); // Find the post with the matching token
      if (!post) {
        callback(new Error("Post not found")); // If post is not found, pass an error to the callback
        return;
      }
      post.comments.push(comment); // Add the comment to the post's comments array
      // Write the updated posts array to the file
      this.writePostsToFile(posts, (err) => {
        if (err) {
          callback(err); // If there's an error writing to the file, pass the error to the callback
          return;
        }
        callback(null, comment); // If successful, pass the new comment to the callback
      });
    });
  }
}

// Export the Blog class for use in other modules
module.exports = Blog;
