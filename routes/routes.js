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

const authMiddleware = require("../middlewares/authMiddleware");

// USER ROUTES
router.post("/users/register", registerUser);
router.post("/users/login", loginUser);
router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.patch("/users/:id", authMiddleware, editUser);
router.get("/users/:id/follow-unfollow", authMiddleware, followUnfollowUser);
router.post("/users/avatar", authMiddleware, changeUserAvatar);

module.exports = router;
