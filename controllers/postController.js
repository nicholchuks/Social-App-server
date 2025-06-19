const HttpError = require("../models/errorModel");
const UserModel = require("../models/userModel");
const PostModel = require("../models/postModel");

const { v4: uuid } = require("uuid");
const cloudinary = require("../utils/cloudinary");
const path = require("path");
const fs = require("fs");

// *******************CREATE POST
// POST : api/posts
// PROTECTED

const createPost = async (req, res, next) => {
  try {
    res.json("Create Post");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************GET POST
// GET : api/posts/:id
// PROTECTED

const getPost = async (req, res, next) => {
  try {
    res.json("Get Post");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************GET POSTS
// GET : api/posts
// PROTECTED

const getPosts = async (req, res, next) => {
  try {
    res.json("Get all Posts");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************UPDATE POST
// POST : api/posts/:id
// PROTECTED

const updatePost = async (req, res, next) => {
  try {
    res.json("update Post");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************DELETE POST
// DELETE : api/posts/:id
// PROTECTED

const deletePost = async (req, res, next) => {
  try {
    res.json("delete Post");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************GET FOLLOWING POST
// GET : api/posts/following
// PROTECTED

const getFollowingPosts = async (req, res, next) => {
  try {
    res.json("Get Following Post");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************LIKE/DiSLIKE POST
// POST : api/posts/:id/like
// PROTECTED

const likeDislikePost = async (req, res, next) => {
  try {
    res.json("Like/Dislike Post");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ******************* USER POST
// GET : api/users/:id/posts
// PROTECTED

const getUserPosts = async (req, res, next) => {
  try {
    res.json("Get User Post");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ******************* CREATE BOOKMARK
// POST : api/posts/:id/bookmark
// PROTECTED

const createBookmark = async (req, res, next) => {
  try {
    res.json("Create Bookmark");
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ******************* GET BOOKMARKS
// GET : api/bookmarks
// PROTECTED

const getUserBookmarks = async (req, res, next) => {
  try {
    res.json("Get User Bookmark");
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
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
};
