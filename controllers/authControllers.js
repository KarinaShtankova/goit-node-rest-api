import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import Jimp from "jimp";

import User from "../models/users.js";

import HttpError from "../helpers/HttpError.js";
import sendMail from "../helpers/sendEmail.js";

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
    const verificationToken = crypto.randomUUID();
    const avatarURL = gravatar.url(email);
    const newUser = await User.create({
      ...req.body,
      password: hashPassword,
      avatarURL,
      verificationToken,
    });

    const verifyEmail = {
      to: email,
      from: "alextrejo@meta.ua",
      subject: "Welcome to Phonebook",
      html: `To confirm your email please go to the <a href="http://localhost:3000/users/verify/${verificationToken}"> link`,
      text: `To confirm your email please open the link http://localhost:3000/users/verify/${verificationToken}`,
    };
    await sendMail(verifyEmail);

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
    if (user.verify === false) {
      throw HttpError(401, "Please verify your email");
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

export const verifyUser = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      throw HttpError(404, "User not found");
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: "",
    });
    res.status(200).json({
      message: "Verification successful",
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerifyEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (user === null) {
      throw HttpError(401, "Email is wrong");
    }
    if (user.verify === true) {
      throw HttpError(404, "Verification has already been passed");
    }

    const verifyEmail = {
      to: email,
      from: "alextrejo@meta.ua",
      subject: "Welcome to Phonebook",
      html: `To confirm your email please go to the <a href="http://localhost:3000/users/verify/${user.verificationToken}"> link`,
      text: `To confirm your email please open the link http://localhost:3000/users/verify/${user.verificationToken}`,
    };
    await sendMail(verifyEmail);

    res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    next(error);
  }
};
