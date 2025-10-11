const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require('cors');

const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const notifyRouter = require("./routes/notify");
const searchRouter = require("./routes/search");
const healthCheckRouter = require("./routes/healthcheck");

const app = express();
dotenv.config({ path: "./config.env" });
const port = process.env.PORT || 17000;
const whitelist = process.env.CORS_WHITELIST?.split(',').map(origin => origin.trim());

mongoose.connect(process.env.MONGODB_URI, {
  dbName: process.env.MONGODB_NAME,
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

app.use(express.static("./frontend/build"));

console.log("whitelist:", whitelist);

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf('*') !== -1 || !origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// app.use(cors({
//   origin: '*',
//   methods: '*',
//   credentials: true
// }));

app.use("/users", userRouter);
app.use("/users/auth", authRouter);
app.use("/users/post", postRouter);
app.use("/users/notify", notifyRouter);
app.use("/users/search", searchRouter);
app.use("/healthcheck", healthCheckRouter)

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
