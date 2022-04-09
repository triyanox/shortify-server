const express = require("express");
const router = express.Router();
const _ = require("lodash");
const RequestLog = require("../models/request_log");
const auth = require("../middleware/auth");
const { ShortURL } = require("../models/ShortURL");

router.get("/:id", auth, async (req, res) => {
  try {
    let short_url = req.params.id;
    let url = await ShortURL.findOne({ short_url: short_url });
    if (!url) {
      return res.status(404).send("URL not found");
    }
    let an = await RequestLog.findOne({
      shortUrl: url.short_url,
      user_id: url.user_id,
    });

    if (!an) {
      return res.status(404).send("No analytics found");
    }
    return res.send(an);
  } catch (ex) {
    res.status(500).send(ex);
  }
});

module.exports = router;
