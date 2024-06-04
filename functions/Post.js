// Define the Post class
class Post {
  /**
   * Constructor to initialize a Post object
   * @param {string} token - The unique identifier for the post.
   * @param {string} title - The title of the post.
   * @param {string} description - A brief description of the post.
   * @param {string} content - The main content of the post.
   * @param {string} author - The author of the post.
   * @param {string} imageURL - The URL of the image associated with the post.
   * @param {string} backgroundimg - The background image URL for the post.
   * @param {Array} comments - An array to store comments related to the post. Default is an empty array.
   */
  constructor(
    token,
    title,
    description,
    content,
    author,
    imageURL,
    backgroundimg,
    comments = []
  ) {
    this.token = token;
    this.title = title;
    this.description = description;
    this.content = content;
    this.author = author;
    this.imageURL = imageURL;
    this.backgroundimg = backgroundimg;
    this.comments = comments;
  }
}

// Export the Post class for use in other modules
module.exports = Post;
