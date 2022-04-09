const mongoose = require("mongoose");

let RequestLog = mongoose.model("RequestLog", {
  url_id: { type: mongoose.Schema.Types.ObjectId, ref: "ShortURL" },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shortUrl: String,
  responseTime: Number,
  year: Number,
  month: Number,
  day: Number,
  hour: Number,
  minute: Number,
  views: Number,
  method: String,
});

module.exports = RequestLog;
