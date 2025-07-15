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
    const { body } = req.body;
    if (!body) {
      return next(new HttpError("Fill in text field and choose image", 422));
    }
    if (!req.files.image) {
      return next(new HttpError("Please choose an image", 422));
    }

    const { image } = req.files;
    // image should be less tham 1mb
    if (image.size > 1000000) {
      return next(new HttpError("File size too big. Should be less than 1mb"));
    }

    // Rename the image
    let fileName = image.name;
    fileName = fileName.split(".");
    fileName = fileName[0] + uuid() + "." + fileName[fileName.length - 1];

    // Upload file to upload folder
    await image.mv(
      path.join(__dirname, "..", "uploads", fileName),
      async (err) => {
        if (err) {
          return next(HttpError(err));
        }

        //  store image on cloudinary
        const result = await cloudinary.uploader.upload(
          path.join(__dirname, "..", "uploads", fileName),
          { resource_type: "image" }
        );
        if (!result.secure_url) {
          return next(
            new HttpError("Couldn't upload image to cloudinary", 422)
          );
        }

        //Save user to db
        const newPost = await PostModel.create({
          creator: req.user.id,
          body,
          image: result.secure_url,
        });
        await UserModel.findByIdAndUpdate(newPost?.creator, {
          $push: { posts: newPost?._id },
        });
        res.status(200).json(newPost);
      }
    );
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************GET POST
// GET : api/posts/:id
// PROTECTED

// const getPost = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     // const post = await PostModel.findById(id);
//     const post = await PostModel.findById(id)
//       .populate("creator")
//       .populate({ path: "comments", options: { sort: { createdAt: -1 } } });
//     res.status(200).json(post);
//   } catch (error) {
//     return next(new HttpError(error));
//   }
// };

const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await PostModel.findById(id)
      .populate("creator")
      .populate({
        path: "comments",
        populate: {
          path: "creator.creatorId",
          model: "User",
        },
        options: { sort: { createdAt: -1 } },
      });

    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************GET POSTS
// GET : api/posts
// PROTECTED

const getPosts = async (req, res, next) => {
  try {
    const posts = await PostModel.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************UPDATE POST
// PATCH : api/posts/:id
// PROTECTED

const updatePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { body } = req.body;

    //Get post from db
    const post = await PostModel.findById(postId);
    //  chech if the creator of the post is the logged in user
    if (post?.creator != req.user.id) {
      return next(
        new HttpError(
          "You can't update this post since you are not the creator",
          403
        )
      );
    }
    const updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      { body },
      { new: true }
    );
    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************DELETE POST
// DELETE : api/posts/:id
// PROTECTED

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;

    //Get post from db
    const post = await PostModel.findById(postId);
    //  chech if the creator of the post is the logged in user
    if (post?.creator != req.user.id) {
      return next(
        new HttpError(
          "You can't delete this post since you are not the creator",
          422
        )
      );
    }
    const deletePost = await PostModel.findByIdAndDelete(postId);
    await UserModel.findByIdAndUpdate(post?.creator, {
      $pull: { posts: post?._id },
    });
    res.status(200).json(deletePost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************GET FOLLOWING POST
// GET : api/posts/following
// PROTECTED

const getFollowingPosts = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    const posts = await PostModel.find({ creator: { $in: user?.following } });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// *******************LIKE/DiSLIKE POST
// GET : api/posts/:id/like
// PROTECTED

const likeDislikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await PostModel.findById(id);
    // check if the logged in user has already liked post
    let updatedPost;
    if (post?.likes.includes(req.user.id)) {
      updatedPost = await PostModel.findByIdAndUpdate(
        id,
        { $pull: { likes: req.user.id } },
        { new: true }
      );
    } else {
      updatedPost = await PostModel.findByIdAndUpdate(
        id,
        { $push: { likes: req.user.id } },
        { new: true }
      );
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ******************* USER POST
// GET : api/users/:id/posts
// PROTECTED

const getUserPosts = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const posts = await UserModel.findById(userId).populate({
      path: "posts",
      options: { sort: { createdAt: -1 } },
    });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ******************* CREATE BOOKMARK
// POST : api/posts/:id/bookmark
// PROTECTED

const createBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;
    // get user and check if post is already in his bookmarks. If so then remove post, otherwise add post to the bookmarks
    const user = await UserModel.findById(req.user.id);
    const postIsBookmarked = user?.bookmarks?.includes(id);
    if (postIsBookmarked) {
      const userBookmarks = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $pull: { bookmarks: id } },
        { new: true }
      );
      res.status(200).json(userBookmarks);
    } else {
      const userBookmarks = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $push: { bookmarks: id } },
        { new: true }
      );
      res.status(200).json(userBookmarks);
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ******************* GET BOOKMARKS
// GET : api/bookmarks
// PROTECTED

const getUserBookmarks = async (req, res, next) => {
  try {
    const userBookmarks = await UserModel.findById(req.user.id).populate({
      path: "bookmarks",
      options: { sort: { createdAt: -1 } },
    });
    res.status(200).json(userBookmarks);
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
