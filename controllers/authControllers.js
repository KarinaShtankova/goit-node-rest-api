import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import Jimp from "jimp";

import User from "../models/users.js";

import HttpError from "../helpers/HttpError.js";
import { log } from "node:console";

const avatarDir = path.resolve("public", "avatars");

const SECRET_KEY = process.env.SECRET_KEY;

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user !== null) {
      throw HttpError(409, "Email in use");
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const avatarURL = gravatar.url(email);
    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
    });
    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user === null) {
      throw HttpError(401, "Email or password is wrong");
    }
    const passwordCompare = await bcrypt.compare(password, user.password);
    if (passwordCompare === false) {
      throw HttpError(401, "Email or password is wrong");
    }

    const payload = {
      id: user._id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "20h" });
    await User.findByIdAndUpdate(user._id, { token });

    res.status(200).json({
      token: token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: null });

    res.status(204).json({});
  } catch (error) {
    next(error);
  }
};

export const currentUser = async (req, res, next) => {
  try {
    const { email, subscription } = req.user;
    res.status(200).json({
      email,
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const result = await User.findByIdAndUpdate(_id, req.body, { new: true });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    const { _id } = req.user;
    if (!req.file) {
      throw HttpError(400, "Avatar not uploaded");
    }
    const { path: tmpUpload, originalname } = req.file;

    const img = await Jimp.read(tmpUpload);
    img.resize(250, 250).write(tmpUpload);

    const filename = `${crypto.randomUUID()}_${originalname}`;
    const resultUpload = path.join(avatarDir, filename);

    await fs.rename(tmpUpload, resultUpload);

    const avatarURL = path.join("avatars", filename);

    await User.findByIdAndUpdate(_id, { avatarURL });

    res.status(200).json({
      avatarURL,
    });
  } catch (error) {
    next(error);
  }
};
