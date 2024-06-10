const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const Blog = require("../services/blog");
const blog = new Blog();

const router = express.Router();

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
const getAllPosts = async (req, res, next) => {
  try {
    let posts = await blog.getAllPosts();
    posts = posts.map(post => {
      post.imageURL = constructUrl(req, post.imageURL);
      post.backgroundimg = constructUrl(req, post.backgroundimg);
      return post;
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

// Handler function to get a post by its token
const getPostByToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    const post = await blog.getPostByToken(token);
    if (post) {
      post.imageURL = constructUrl(req, post.imageURL);
      post.backgroundimg = constructUrl(req, post.backgroundimg);
      res.json(post);
    } else {
      res.status(404).send("Post not found");
    }
  } catch (err) {
    next(err);
  }
};

const createPost = async (req, res, next) => {
  try {
    upload.fields([{ name: "imageURL", maxCount: 1 }, { name: "backgroundimg", maxCount: 1 }])(req, res, async (err) => {
      if (err) {
        return res.status(500).send("Internal Server Error");
      }

      if (!req.files || !req.files.imageURL || !req.files.backgroundimg) {
        return res.status(400).send("Both images are required");
      }

      // Check if authorName and authorEmail are provided, otherwise use dummy data
      const authorName = req.body.authorName ? req.body.authorName : "Unknown";
      const authorEmail = req.body.authorEmail ? req.body.authorEmail : "unknown@example.com";

      const postData = {
        ...req.body,
        imageURL: `/assets/faces/${req.files.imageURL[0].filename}`,
        backgroundimg: `/assets/${req.files.backgroundimg[0].filename}`,
        author: {
          name: authorName,
          email: authorEmail
        }
      };

      const createdPost = await blog.createPost(postData);
      res.status(201).json(createdPost);
    });
  } catch (err) {
    next(err);
  }
};


// Handler function to update a post by its token
const updatePostByToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    await blog.updatePostByToken(token, req.body);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

// Handler function to delete a post by its token
const deletePostByToken = async (req, res, next) => {
  try {
    const token = req.params.token;
    await blog.deletePostByToken(token);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

// Handler function to add a comment to a post
const addCommentToPost = async (req, res, next) => {
  try {
    const token = req.params.token;
    const { user, text } = req.body;
    if (!user || !text) {
      return res.status(400).send("User and text are required");
    }

    const comment = { user, text, timestamp: new Date().toISOString() };
    const addedComment = await blog.addCommentToPost(token, comment);
    res.status(200).json(addedComment);
  } catch (err) {
    next(err);
  }
};

const deleteCommentFromPost = async (req, res, next) => {
  try {
    const token = req.params.token;
    await blog.deleteCommentFromPost(token);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

// Define routes
router.route("/").get(getAllPosts).post(createPost);
router.route("/:token").get(getPostByToken).put(updatePostByToken).delete(deletePostByToken);
router.route("/:token/comments").post(addCommentToPost);
router.route("/:token/comments").delete(deleteCommentFromPost);

module.exports = router;
