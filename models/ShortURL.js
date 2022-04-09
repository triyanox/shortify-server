const mongoose = require("mongoose");
const validUrl = require("valid-url");
const Joi = require("joi");

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: { type: String, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const ShortURL = mongoose.model("ShortURL", urlSchema);

function validateUrl(url) {
  if (validUrl.isUri(url)) {
    return true;
  } else {
    return false;
  }
}

function validateSurl(url) {
  const schema = Joi.object({
    surl: Joi.string().alphanum().min(3).max(30),
  });
  const result = schema.validate({ surl: url });
  return result;
}

exports.ShortURL = ShortURL;
exports.validateUrl = validateUrl;
exports.validateSurl = validateSurl;
