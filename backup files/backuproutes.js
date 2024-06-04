// const express = require("express");
// const multer = require("multer");
// const { v4: uuidv4 } = require("uuid");
// const WebSocket = require("ws");
// const Blog = require("../functions/Blog");

// const router = express.Router();
// const blog = new Blog("./storage/blogPosts.json");

// // Use environment variable for base URL
// const apiUrl = process.env.REACT_APP_API_URL || '  http://localhost:5000';

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (file.fieldname === "imageURL") {
//       cb(null, "assets/faces/");
//     } else if (file.fieldname === "backgroundimg") {
//       cb(null, "assets");
//     } else {
//       cb(null, "assets");
//     }
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${uuidv4()}-${file.originalname}`;
//     cb(null, uniqueName);
//   },
// });

// const upload = multer({ storage: storage });

// // Handler functions
// const getAllPosts = (req, res) => {
//   blog.getAllPosts((err, posts) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Internal Server Error");
//     }
//     res.json(posts);
//   });
// };

// const getPostByToken = (req, res) => {
//   const token = req.params.token;
//   blog.getPostByToken(token, (err, post) => {
//     if (err) {
//       console.error(err);
//       return res.status(404).send("Post not found");
//     }
//     res.json(post);
//   });
// };

// const createPost = (req, res) => {
//   upload.fields([
//     { name: "imageURL", maxCount: 1 },
//     { name: "backgroundimg", maxCount: 1 },
//   ])(req, res, (err) => {
//     if (err) {
//       console.error("Multer error:", err);
//       return res.status(500).send("Internal Server Error");
//     }

//     if (!req.files || !req.files.imageURL || !req.files.backgroundimg) {
//       return res.status(400).send("Both images are required");
//     }

//     const postData = {
//       ...req.body,
//       imageURL: req.files.imageURL
//         ? `${apiUrl}/assets/faces/${req.files.imageURL[0].filename}`
//         : null,
//       backgroundimg: req.files.backgroundimg
//         ? `${apiUrl}/assets/${req.files.backgroundimg[0].filename}`
//         : null,
//     };

//     blog.createPost(postData, (err, createdPost) => {
//       if (err) {
//         console.error("Error creating post:", err);
//         return res.status(500).send("Internal Server Error");
//       }

//       broadcastNewPost(createdPost);

//       res.status(201).json(createdPost);
//     });
//   });
// };

// const updatePostByToken = (req, res) => {
//   const token = req.params.token;
//   const updatedPostData = req.body;
//   blog.updatePostByToken(token, updatedPostData, (err) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Internal Server Error");
//     }
//     res.sendStatus(204);
//   });
// };

// const deletePostByToken = (req, res) => {
//   const token = req.params.token;
//   blog.deletePostByToken(token, (err) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Internal Server Error");
//     }
//     res.sendStatus(204);
//   });
// };

// // WebSocket setup
// const wss = new WebSocket.Server({ noServer: true });

// wss.on("connection", (ws) => {
//   console.log("Client connected");
// });

// function broadcastNewPost(post) {
//   wss.clients.forEach((client) => {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(JSON.stringify({ type: "new_post", post }));
//     }
//   });
// }

// // Route definitions
// router.route("/").get(getAllPosts).post(createPost);

// router
//   .route("/:token")
//   .get(getPostByToken)
//   .put(updatePostByToken)
//   .delete(deletePostByToken);

// module.exports = { router, wss };
