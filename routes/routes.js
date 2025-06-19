const router = require("express").Router();

const {
  registerUser,
  loginUser,
  getUser,
  getUsers,
  followUnfollowUser,
  editUser,
  changeUserAvatar,
} = require("../controllers/userControllers");

const {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getPosts,
  getUserPosts,
  getUserBookmarks,
  createBookmark,
  likeDislikePost,
  getFollowingPosts,
} = require("../controllers/postController");

const {
  createComment,
  getPostComment,
  deleteComment,
} = require("../controllers/commentController");

const authMiddleware = require("../middlewares/authMiddleware");
const { create } = require("../models/commentModel");

// USER ROUTES
router.post("/users/register", registerUser);
router.post("/users/login", loginUser);
router.get("/users/bookmarks", authMiddleware, getUserBookmarks); // brought this router up here to avoid conflict with get user
router.get("/users/:id", authMiddleware, getUser);
router.get("/users", authMiddleware, getUsers);
router.patch("/users/:id", authMiddleware, editUser);
router.get("/users/:id/follow-unfollow", authMiddleware, followUnfollowUser);
router.post("/users/avatar", authMiddleware, changeUserAvatar);
router.get("/users/:id/posts", authMiddleware, getUserPosts);

// POST ROUTES
router.post("/posts", authMiddleware, createPost);
router.get("/posts/following", authMiddleware, getFollowingPosts);
router.get("/posts/:id", authMiddleware, getPost);
router.get("/posts", authMiddleware, getPosts);
router.patch("/posts/:id", authMiddleware, updatePost);
router.delete("/posts/:id", authMiddleware, deletePost);
router.get("/posts/:id/like", authMiddleware, likeDislikePost);
router.get("/posts/:id/bookmark", authMiddleware, createBookmark);

// COMMENT ROUTES
router.post("/comments/:postId", authMiddleware, createComment);
router.get("/comments/:postId", authMiddleware, getPostComment);
router.delete("/comments/:commentId", authMiddleware, deleteComment);

module.exports = router;
