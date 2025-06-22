const HttpError = require("../models/errorModel");
const CommentModel = require("../models/commentModel");
const UserModel = require("../models/userModel");
const PostModel = require("../models/postModel");

// const { v4: uuid } = require("uuid");
// const cloudinary = require("../utils/cloudinary");
// const path = require("path");
// const fs = require("fs");

// *******************CREATE COMMENT
// POST : api/comments/:postId
// PROTECTED

const createComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    if (!comment) {
      return next(new HttpError("Please write a comment", 422));
    }

    // Get comment creator from db
    const commentCreator = await UserModel.findById(req.user.id);
    const newComment = await CommentModel.create({
      creator: {
        creatorId: req.user.id,
        creatorName: commentCreator?.fullName,
        creatorPhoto: commentCreator?.profilePhoto,
      },
      comment,
      postId,
    });
    await PostModel.findByIdAndUpdate(
      postId,
      { $push: { comments: newComment?._id } },
      { new: true }
    );
    res.status(200).json(newComment);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ******************* GET POST COMMENT
// POST : api/comments/:postId
// PROTECTED
const getPostComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const comments = await PostModel.findById(postId).populate({
      path: "comments",
      options: { sort: { createdAt: -1 } },
    });
    res.status(200).json(comments);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// ******************* DELETE COMMENT
// DELETE : api/comments/:commentId
// PROTECTED
const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    // get the comment from db
    const comment = await CommentModel.findById(commentId);
    const commentCreator = await UserModel.findById(
      comment?.creator?.creatorId
    );
    // check if the creator is the one performing the deletion
    if (commentCreator?._id != req.user.id) {
      return next(new HttpError("Unauthorized actions", 403));
    }
    // remove comment id from post comments array
    await PostModel.findByIdAndUpdate(comment?.postId, {
      $pull: { comments: commentId },
    });
    const deletedComment = await CommentModel.findByIdAndDelete(commentId);
    res.status(200).json(deletedComment);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = { createComment, getPostComment, deleteComment };
