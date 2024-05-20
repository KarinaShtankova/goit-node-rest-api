import Contact from "../models/contacts.js";

import HttpError from "../helpers/HttpError.js";

export const getAllContacts = async (req, res, next) => {
  try {
    const { _id: owner } = req.user;
    const { page = 1, limit = 20, favorite } = req.query;
    const skip = (page - 1) * limit;

    let result;
    if (favorite) {
      result = await Contact.find({ owner, favorite }, "-_", {
        skip,
        limit,
      });
    } else {
      result = await Contact.find({ owner }, "-_", { skip, limit });
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getOneContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) {
      throw HttpError(404);
    }
    if (!contact.owner || contact.owner.toString() !== req.user.id) {
      throw HttpError(404);
    }
    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) {
      throw HttpError(404);
    }
    if (!contact.owner || contact.owner.toString() !== req.user.id) {
      throw HttpError(404);
    }
    const result = await Contact.findByIdAndDelete(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const { _id: owner } = req.user;
    const result = await Contact.create({ ...req.body, owner });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) {
      throw HttpError(404);
    }
    if (!contact.owner || contact.owner.toString() !== req.user.id) {
      throw HttpError(404);
    }

    const result = await Contact.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateStatusContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact) {
      throw HttpError(404);
    }
    if (!contact.owner || contact.owner.toString() !== req.user.id) {
      throw HttpError(404);
    }
    const result = await Contact.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
