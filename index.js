const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const moment = require("moment");
const config = require("config");

const url = require("./routes/shortURLs");
const auth = require("./routes/auth");
const analytics = require("./routes/analytics");
const users = require("./routes/users");

require("./prod")(app);

const MONGO_URI = process.env["DB_URI"];

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

if (!config.get("jwtPrivateKey")) {
  console.log("FATAL ERROR: jwtPrivateKey is not defined");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/url", url);
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/an", analytics);

const port = process.env.PORT || 5000;
app.listen(port, console.log(`Listening on port ${port}`));
