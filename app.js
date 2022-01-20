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
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.json({
        error: "User already exists with same email",
      });
    }
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
    console.log(user, "user");
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
/////////////////////////////////////////////////////////////////////////////////////////////////

require("./BookDetails");
const Books = new mongoose.model("BookDetails");

app.post("/upload-book", async (req, res) => {
  try {
    const {
      title,
      uploadedBy,
      date,
      author,
      category,
      description,
      image,
      pdf,
      views,
      rating,
      guestId,
      ratingCount,
      ratingAdd,
    } = req.body;
    console.log(req.body, "rate");
    const book = await Books.create({
      title,
      uploadedBy,
      date,
      author,
      category,
      description,
      image,
      pdf,
      views,
      rating,
      guestId,
      ratingCount,
      ratingAdd,
    });
    res.json({ status: "ok", data: book });
    console.log(book.uploadedBy);
    try {
      User.findOne({ guestId: book.guestId }).then((data) => {
        var totalBooksUploaded = new Array();

        if (data.booksUploaded == undefined || data.booksUploaded == "") {
          totalBooksUploaded.push(book._id);
        } else {
          totalBooksUploaded = [...data.booksUploaded, book._id.toString()];
          console.log(totalBooksUploaded, "yesss");
        }
        User.updateOne(
          {
            guestId: book.guestId,
          },
          {
            $set: {
              booksUploaded: totalBooksUploaded,
            },
          },
          { overwrite: false, new: true },
          function (err, res) {
            console.log(res, err);
          }
        );
      });
    } catch (err) {
      res.send(err);
    }
  } catch (error) {
    res.send(error);
  }
});

app.post("/give-rating", async (req, res) => {
  const { bookid, rating, review } = req.body;
  try {
    Books.findOne({ _id: bookid }).then((data) => {
      const bookrating = parseFloat(data.ratingAdd);
      const ratingCount = parseInt(data.ratingCount + 1);
      const totalRating = (bookrating + rating) / ratingCount;
      console.log(totalRating, "total");

      var allReview = new Array();

      if (data.review == undefined || data.review == "") {
        allReview.push(review);
      } else {
        allReview = [...data.review, review];
      }
      console.log(allReview, "review");
      Books.updateOne(
        {
          _id: bookid,
        },
        {
          $set: {
            review: allReview,
            rating: parseFloat(totalRating),
            ratingCount: ratingCount,
            ratingAdd: bookrating + rating,
          },
        },
        { overwrite: false, new: true },
        function (err, res) {
          console.log(res, err);
        }
      );
    });
    return res.json({ data: "Updated" });
  } catch (error) {}
});

app.post("/get-user-uploadedbooks", async (req, res) => {
  const userids = req.body.userids;
  Books.find({ _id: { $in: userids } })
    .then((data) => {
      res.json({ status: "ok", data: data });
    })
    .catch((err) => {
      res.json({ status: "ok", error: err });
    });
});

app.post("/get-book-details", async (req, res) => {
  Books.find({ status: 0 })
    .then((data) => {
      res.json({ status: "ok", data: data });
    })
    .catch((err) => {
      res.json({ status: "ok", error: err });
    });
});
// app.post("/get-book-details", async (req, res, next) => {
//   const requestCount = req.query.count;
//   Books.find({ status: 0 })
//     .countDocuments()
//     .then((count) => {
//       if (requestCount > count) {
//         const error = new Error("invalid request in quantity");
//         error.statusCode = 400;
//         throw error;
//       }

//       return Books.find({ status: 0 }).limit(Number(requestCount));
//     })
//     .then((posts) => {
//       res.status(200).json({ posts: posts });
//     })
//     .catch((err) => {
//       res.json({ status: "ok", error: err });
//     });
// });

app.post("/get-review", async (req, res) => {
  const requestCount = req.query.count;
  const bookid = req.body.bookid;
  Books.find({ _id: bookid }, { review: 1, _id: 0 })
    // .countDocuments()
    .then((data) => {
      console.log(requestCount, "req");
      const count = data[0].review.length;
      const finaldata = 0;
      if (requestCount > count) {
        res.json({ status: "finish", data: data[0].review.slice(0, count) });
        // const error = new Error("invalid request in quantity");
        // error.statusCode = 400;
        // throw error;
      } else {
        console.log(count, "aaaaa");

        res.json({ status: "ok", data: data[0].review.slice(0, requestCount) });
      }
    })
    .catch((err) => {
      res.json({ status: "error", error: err });
    });
});

app.post("/update-book", async (req, res) => {
  const { userid, fields } = req.body;
  try {
    Books.updateOne(
      { _id: userid },
      {
        $set: fields,
      },
      { overwrite: false, new: true },
      function (err, res) {
        console.log(err, res);
      }
    );
    return res.json({ status: "ok", data: "Updated" });
  } catch (error) {
    console.log(error);
  }
});

app.post("/delete-book", async (req, res) => {
  const { userid } = req.body;
  try {
    Books.deleteOne(
      {
        _id: userid,
      },
      function (err, res) {
        console.log(err, res);
      }
    );
    return res.json({ status: "ok", data: "Deleted" });
  } catch (error) {
    console.log(error);
  }
});

//confirming that our node js server is started
app.listen(PORT, () => {
  console.log(`Connected to database on ${PORT} `);
});
