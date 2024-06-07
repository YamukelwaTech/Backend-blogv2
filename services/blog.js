const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");

class Blog {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async readPostsFromFile() {
    const data = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(data);
  }

  async writePostsToFile(posts) {
    await fs.writeFile(this.filePath, JSON.stringify(posts, null, 2), "utf8");
  }

  async getAllPosts() {
    return await this.readPostsFromFile();
  }

  async getPostByToken(token) {
    const posts = await this.readPostsFromFile();
    return posts.find((post) => post.token === token);
  }

  async createPost(post) {
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

    const posts = await this.readPostsFromFile();
    posts.push(post);
    await this.writePostsToFile(posts);
    return post;
  }

  async updatePostByToken(token, updatedPostData) {
    const posts = await this.readPostsFromFile();
    const updatedPosts = posts.map((post) =>
      post.token === token ? { ...post, ...updatedPostData } : post
    );
    await this.writePostsToFile(updatedPosts);
  }

  async deletePostByToken(token) {
    const posts = await this.readPostsFromFile();
    const updatedPosts = posts.filter((post) => post.token !== token);
    await this.writePostsToFile(updatedPosts);
  }

  async addCommentToPost(token, comment) {
    const posts = await this.readPostsFromFile();
    const post = posts.find((post) => post.token === token);
    if (post) {
      post.comments.push(comment);
      await this.writePostsToFile(posts);
      return comment;
    }
    throw new Error("Post not found");
  }
}

module.exports = Blog;
