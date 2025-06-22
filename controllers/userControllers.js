const HttpError = require("../models/errorModel");
const UserModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { v4: uuid } = require("uuid");
const cloudinary = require("../utils/cloudinary");
const path = require("path");
const fs = require("fs");

// **************** REGISTER USER
// POST: api/users/register
// UNPROTECTED
const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;
    if (!fullName || !email || !password || !confirmPassword) {
      return next(new HttpError("Fill in all fields", 422));
    }

    // make email lowercase
    const newEmail = email.toLowerCase();
    // check if email alreay exist in db
    const emailExist = await UserModel.findOne({ email: newEmail });
    if (emailExist) {
      return next(new HttpError("Email already exist", 422));
    }
    // check if password match
    if (password != confirmPassword) {
      return next(new HttpError("Passwords do not match", 422));
    }

    // Pasword length must be greater than 6 characters
    if (password.trim().length < 6) {
      return next(
        new HttpError("Password length must be greater than 6 chracters", 422)
      );
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    // save data to the db
    const newUser = await UserModel.create({
      fullName,
      email: newEmail,
      password: hashPass,
    });
    res.status(201).json(newUser);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// **************** LOGIN USER
// POST: api/users/login
// UNPROTECTED
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new HttpError("Fill in all fields", 422));
    }

    const newEmail = email.toLowerCase();
    const user = await UserModel.findOne({ email: newEmail });
    if (!user) {
      return next(new HttpError("Invalid credentials.", 422));
    }
    // compare passwords
    const comparePass = await bcrypt.compare(password, user?.password);
    if (!comparePass) {
      return next(new HttpError("Invalid credentials", 422));
    }

    // const { uPassword, ...userInfo } = user;

    const token = await jwt.sign({ id: user?._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // res.status(200).json({ token, id: user?._id, ...userInfo });
    res
      .status(200)
      .json({ token, id: user?._id, profilePhoto: user.profilePhoto });
  } catch (error) {
    return next(new HttpError(error));
  }
};

// **************** GET USER
// GET: api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select("-password");
    if (!user) {
      return next(new HttpError("User not found", 422));
    }
    res.status(200).json(user);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// **************** GET USERS
// GET: api/users
// PROTECTED
const getUsers = async (req, res, next) => {
  try {
    const user = await UserModel.find().limit(10).sort({ createdAt: -1 });
    if (!user) {
      return next(new HttpError("User not found", 422));
    }
    res.status(200).json(user);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// **************** EDIT USER
// PATCH: api/users/edit
// PROTECTED
const editUser = async (req, res, next) => {
  try {
    const { fullName, bio } = req.body;
    const editedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      { fullName, bio },
      { new: true }
    );
    res.status(200).json(editedUser);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// **************** FOLLOW/UNFOLLOW USER
// GET: api/users/:id/follow-unfollow
// PROTECTED
const followUnfollowUser = async (req, res, next) => {
  try {
    const userToFollowId = req.params.id;
    if (req.user.id == userToFollowId) {
      return next(new HttpError("You cant follow/unfollow yourself", 422));
    }

    // Get the currentUser from the db
    const currentUser = await UserModel.findById(req.user.id);
    const isFollowing = currentUser?.following?.includes(userToFollowId);
    // Follow if not following, else unfollow if following
    if (!isFollowing) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userToFollowId,
        { $push: { followers: req.user.id } },
        { new: true }
      );
      await UserModel.findByIdAndUpdate(
        req.user.id,
        { $push: { following: userToFollowId } },
        { new: true }
      );
      res.json(updatedUser);
    } else {
      const updatedUser = await UserModel.findByIdAndUpdate(
        currentUser,
        { $pull: { following: req.user.id } },
        { new: true }
      );
      await UserModel.findByIdAndUpdate(
        req.user.id,
        { $pull: { following: userToFollowId } },
        { new: true }
      );
      res.json(updatedUser);
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

// **************** CHANGE USER AVATER
// POST: api/users/avatar
// PROTECTED
const changeUserAvatar = async (req, res, next) => {
  try {
    if (!req.files.avatar) {
      return next(new HttpError("Choose an avatar.", 422));
    }

    const { avatar } = req.files;
    // image should be less tham 1mb
    if (avatar.size > 500000) {
      return next(
        new HttpError("File size too big. Should be less than 500kb")
      );
    }

    // Rename the image
    let fileName = avatar.name;
    fileName = fileName.split(".");
    fileName = fileName[0] + uuid() + "." + fileName[fileName.length - 1];

    // Upload file to upload folder
    avatar.mv(path.join(__dirname, "..", "uploads", fileName), async (err) => {
      if (err) {
        return next(HttpError(err));
      }

      //  store image on cloudinary
      const result = await cloudinary.uploader.upload(
        path.join(__dirname, "..", "uploads", fileName),
        { resource_type: "image" }
      );
      if (!result.secure_url) {
        return next(new HttpError("Couldn't upload image to cloudinary", 422));
      }

      //Save user to db
      const updatedUser = await UserModel.findByIdAndUpdate(
        req.user.id,
        {
          profilePhoto: result?.secure_url,
        },
        { new: true }
      );
      res.status(200).json(updatedUser);
    });
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  getUsers,
  followUnfollowUser,
  editUser,
  changeUserAvatar,
};
