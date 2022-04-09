const { ShortURL, validateUrl, validateSurl } = require("../models/ShortURL");
const { User } = require("../models/user");
const { nanoid } = require("nanoid");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require("lodash");
const RequestLog = require("../models/request_log");
const moment = require("moment");

router.post("/", auth, async (req, res) => {
  try {
    const checkUser = await User.findById(req.user._id);
    if (checkUser.email === "demo@shortify.com") {
      const urlsCount = await ShortURL.countDocuments({ user: req.user._id });
      if (urlsCount >= 5) {
        return res
          .status(403)
          .send("Cannot create more than 5 URLs for demo user");
      }
    }
    let original_url = req.body.url;
    let shortUrl = req.body.surl;
    let user = req.user;
    if (!validateUrl(original_url)) {
      return res.status(400).send("Invalid URL");
    } else {
      const { error } = validateSurl(req.body.surl);
      if (error || !shortUrl) {
        shortUrl = nanoid(10);
      }

      let url = new ShortURL({
        original_url: original_url,
        short_url: shortUrl,
        user_id: user._id,
      });
      await url.save((error, data) => {
        if (error) {
          return res.status(400).send("URL already exists");
        }
        return res.send(data);
      });
    }
  } catch (ex) {
    res.send("Internal Server Error");
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    let id = req.params.id;
    let original_url = req.body.url;
    let shortUrl = req.body.surl;
    if (!validateUrl(original_url)) {
      return res.status(400).send("Invalid URL");
    }
    if (!validateSurl(shortUrl)) {
      return res.status(400).send("Invalid short URL");
    }
    let url = await ShortURL.findByIdAndUpdate(id, {
      original_url: original_url,
      short_url: shortUrl,
    });
    if (!url) {
      return res.status(404).send("Can't update URL");
    }
    await RequestLog.findOneAndUpdate(
      { url_id: id },
      {
        shortUrl: shortUrl,
      }
    );

    return res.send(url);
  } catch (ex) {
    res.send("Internal Server Error");
  }
});

router.delete("/:short_url", auth, async (req, res) => {
  try {
    let shortUrl = req.params.short_url;
    await ShortURL.findOneAndDelete({ short_url: shortUrl }, (error, data) => {
      if (error) {
        return res.status(404).send("The url was not found.");
      }
      return res.send(data);
    }).clone();
    await RequestLog.findOneAndDelete({ shortUrl: shortUrl });
  } catch (ex) {
    res.send("Internal Server Error");
  }
});

router.get("/current/:short_url", async (req, res) => {
  try {
    let short_url = req.params.short_url;

    ShortURL.findOne({ short_url: short_url }, (err, data) => {
      if (err) {
        return res.status(400).json({
          error: "URL not found",
        });
      }

      return res.send(data);
    });
  } catch (ex) {
    res.send("Internal Server Error");
  }
});

router.get("/", auth, async (req, res) => {
  try {
    let user = req.user;
    let urls = await ShortURL.find({ user_id: user._id }).sort({
      createdAt: 1,
    });
    if (!urls) {
      return res.status(404).send("You have no URLs");
    }
    return res.send(urls);
  } catch (ex) {
    res.send("Internal Server Error");
  }
});

router.get("/:short_url", async (req, res) => {
  let requestTime = Date.now();
  try {
    let shortUrl = req.params.short_url;
    let url = await ShortURL.findOne({ short_url: shortUrl });
    if (!url) {
      return res.status(404).send("URL not found");
    }
    let log = await RequestLog.findOne({
      shortUrl: shortUrl,
    });
    if (!log) {
      await RequestLog.create({
        url_id: url._id,
        user_id: url.user_id,
        shortUrl: shortUrl,
        responseTime: Date.now() - requestTime,
        year: moment().format("YYYY"),
        month: moment().format("MM"),
        day: moment().format("DD"),
        hour: moment().format("HH"),
        minute: moment().format("mm"),
        views: 1,
        method: req.method,
      });
    } else {
      await RequestLog.findOneAndUpdate(
        { shortUrl: shortUrl },
        {
          responseTime: Date.now() - requestTime,
          year: moment().format("YYYY"),
          month: moment().format("MM"),
          day: moment().format("DD"),
          hour: moment().format("HH"),
          minute: moment().format("mm"),
          views: log.views + 1,
        },
        { new: true }
      );
    }
    return res.status(302).redirect(url.original_url);
  } catch (ex) {
    res.send("Internal Server Error");
  }
});

module.exports = router;
