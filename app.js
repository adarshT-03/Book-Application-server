const mongoose = require("mongoose");
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const PORT = process.env.PORT || 5000;

app.use(express.json());
//Connecting to Mongo Db
const mongoUri =
  "mongodb+srv://admin:702168@cluster0.vpkqb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const jwt = require("jsonwebtoken");
const JWT_SECRET =
  "jhuguiy(*@(*&*(#$8u49579434759847)(!*)(&)(&!$xquyeriuhkj&*(&*#fhgfjkghjhalkhjhfg";

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
  })
  .then(() => console.log("Connected to database"))
  .catch((e) => console.log(e));

//initializing model

require("./UserDetails");
const User = mongoose.model("UserInfo");
console.log(User);

//registering as a guest
app.post("/register-guest", async (req, res) => {
  try {
    const { guestId } = req.body;
    const user = await User.create({
      guestId,
    });
    // Create token
    const token = jwt.sign({ guestId }, JWT_SECRET);
    if (res.status(201)) {
      console.log(token);
      return res.json({ status: "ok", data: token });
    } else {
      return res.json({
        status: "warning",
        data: { userStatus: user.status },
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/register-new-user", async (req, res) => {
  const {
    guestId,
    uname,
    email,
    password: encryptedPassword,
    mobile,
  } = req.body;

  const password = await bcrypt.hash(encryptedPassword, 10);
  try {
    const user = await User.create({
      guestId,
      uname,
      email,
      password,
      mobile,
    });
  } catch (error) {
    console.log(error, "new user cannot be created");
    res.json({ status: "error" });
  }
  res.json({ status: "ok" });
});

app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).lean();

  if (!user) {
    return res.json({ status: "error", error: "User Not found" });
  }
  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      {
        guestId: user.guestId,
        email: user.email,
      },
      JWT_SECRET
    );
    console.log(user.status, "stat");
    if (res.status(201)) {
      return res.json({ status: "ok", data: token });
    } else {
      return res.json({
        status: "warning",
        data: { userStatus: user.status, userType: user.type },
      });
    }
  }
  res.json({ status: "error", error: "Invalid mobile/password" });
});

app.post("/user-details", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    console.log(user, "us");
    const userid = user.guestId;
    User.findOne({ guestId: userid })
      .then((data) => {
        console.log(data, "dat");
        return res.json({ status: "ok", data: data });
      })
      .catch((err) => {
        return res.json({ status: "error", error: err });
      });
  } catch (error) {
    console.log(error);
    res.json({ status: "error", error: error });
  }
});

app.post("/set-user-details", (req, res) => {
  const { token, fields } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    console.log(user,'user');
    const guestid = user.guestId;
    User.updateOne(
      {
        guestId: guestid,
      },
      {
        $set: fields,
      },
      { overwrite: false, new: true },
      function (err, res) {
        console.log(err, res);
      }
    );
    return res.json({ status: "ok", data: "updated" });
  } catch (error) {
    res.json({ status: "error", error: error });
  }
});

//confirming that our node js server is started
app.listen(PORT, () => {
  console.log(`Connected to database on ${PORT} `);
});
