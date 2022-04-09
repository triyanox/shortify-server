const { User, validateUser } = require("../models/user");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const { ShortURL } = require("../models/ShortURL");
const RequestLog = require("../models/request_log");

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
  } else {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      res.status(400).send("User already registered");
    } else {
      user = new User(_.pick(req.body, ["name", "email", "password"]));
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      user = await user.save();
      const token = user.generateAuthToken();
      res
        .header("x-auth-token", token)
        .header("access-control-expose-headers", "x-auth-token")
        .send(_.pick(user, ["_id", "name", "email"]));
    }
  }
});

router.delete("/", auth, async (req, res) => {
  const checkUser = await User.findById(req.user._id);
  if (checkUser.email === "demo@shortify.com") {
    return res.status(403).send("Cannot delete demo user");
  }
  const user = await User.findByIdAndDelete(req.user._id);
  if (!user) {
    return res.status(404).send("The user with the given ID was not found.");
  }
  await ShortURL.deleteMany({ user: user._id });
  await RequestLog.deleteMany({ user_id: user._id });
  res.send(user);
});

router.put("/", auth, async (req, res) => {
  const user_id = req.user._id;
  const checkUser = await User.findById(user_id);
  if (checkUser.email === "demo@shortify.com") {
    return res.status(403).send("Cannot update demo user");
  }
  const { error } = validateUser(req.body);
  if (error) {
    res.status(400).json({
      error: error.details[0].message,
    });
  } else {
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash(req.body.password, salt);

    const user = await User.findByIdAndUpdate(
      user_id,
      {
        name: req.body.name,
        email: req.body.email,
        password: password,
      },
      { new: true }
    );
    if (!user) {
      return res.status(404).send("The user was not found.");
    }
    const token = user.generateAuthToken();
    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send(user)
      .status(200);
  }
});

module.exports = router;
