const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const Blog = require("../functions/Blog");

const router = express.Router();
const blog = new Blog("./storage/blogPosts.json");

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "imageURL") {
      cb(null, "assets/faces/");
    } else if (file.fieldname === "backgroundimg") {
      cb(null, "assets");
    } else {
      cb(null, "assets");
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

// Helper function to construct URLs with HTTPS
const constructUrl = (req, path) => {
  const protocol = req.secure ? 'https' : 'http';
  return `${protocol}://${req.get("host")}${path}`;
};

// Handler function to get all posts
const getAllPosts = (req, res) => {
  blog.getAllPosts((err, posts) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    posts = posts.map((post) => {
      post.imageURL = constructUrl(req, post.imageURL);
      post.backgroundimg = constructUrl(req, post.backgroundimg);
      return post;
    });
    res.json(posts);
  });
};

// Handler function to get a post by its token
const getPostByToken = (req, res) => {
  const token = req.params.token;
  blog.getPostByToken(token, (err, post) => {
    if (err) {
      console.error(err);
      return res.status(404).send("Post not found");
    }
    post.imageURL = constructUrl(req, post.imageURL);
    post.backgroundimg = constructUrl(req, post.backgroundimg);
    res.json(post);
  });
};

// Handler function to create a new post
const createPost = (req, res) => {
  upload.fields([
    { name: "imageURL", maxCount: 1 },
    { name: "backgroundimg", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (!req.files || !req.files.imageURL || !req.files.backgroundimg) {
      return res.status(400).send("Both images are required");
    }

    const postData = {
      ...req.body,
      imageURL: `/assets/faces/${req.files.imageURL[0].filename}`,
      backgroundimg: `/assets/${req.files.backgroundimg[0].filename}`,
    };

    blog.createPost(postData, (err, createdPost) => {
      if (err) {
        console.error("Error creating post:", err);
        return res.status(500).send("Internal Server Error");
      }

      res.status(201).json(createdPost);
    });
  });
};

// Handler function to update a post by its token
const updatePostByToken = (req, res) => {
  const token = req.params.token;
  const updatedPostData = req.body;
  blog.updatePostByToken(token, updatedPostData, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    res.sendStatus(204);
  });
};

// Handler function to delete a post by its token
const deletePostByToken = (req, res) => {
  const token = req.params.token;

  blog.getPostByToken(token, (err, post) => {
    if (err) {
      console.error(`Error fetching post with token ${token}:`, err);
      return res.status(404).send("Post not found");
    }

    blog.deletePostByToken(token, (err) => {
      if (err) {
        console.error(`Error deleting post with token ${token}:`, err);
        return res.status(500).send("Internal Server Error");
      }
      res.sendStatus(204);
    });
  });
};

// Handler function to add a comment to a post
const addCommentToPost = (req, res) => {
  const token = req.params.token;
  const { user, text } = req.body;

  if (!user || !text) {
    return res.status(400).send("User and text are required");
  }

  const comment = {
    user,
    text,
    timestamp: new Date().toISOString(),
  };

  blog.addCommentToPost(token, comment, (err, comment) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
    res.status(200).json(comment);
  });
};

// WebSocket server setup (commented out for now)
// const wss = new WebSocket.Server({ noServer: true });

// wss.on("connection", (ws) => {
//   console.log("Client connected");
// });

// Function to broadcast new posts to all connected WebSocket clients (commented out for now)
// function broadcastNewPost(post) {
//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify({ type: "new_post", post }));
//     }
//   });
// }

// Define routes
router.route("/").get(getAllPosts).post(createPost);
router.route("/:token").get(getPostByToken).put(updatePostByToken).delete(deletePostByToken);
router.route("/:token/comments").post(addCommentToPost);

module.exports = { router };
