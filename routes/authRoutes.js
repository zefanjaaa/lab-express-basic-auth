const router = require("express").Router();
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { isLoggedIn, isLoggedOut } = require("../middelware/route-guard.js");
const saltRounds = 8;

//signing in the user
router.get("/signup", isLoggedOut, (req, res) => {
  data = { userInSession: req.session.currentuser };
  res.render("auth/signup", data);
});

router.post("/signup", (req, res, next) => {
  console.log("The information is traveling", req.body);
  const { username, password } = req.body;

  if (!username || !password) {
    res.render("auth/signup", {
      errormessage: "Please fill out all the required fields",
    });
    return;
  }

  bcrypt
    .genSalt(saltRounds)
    .then((salt) => {
      console.log("Its salty in here", salt);
      return bcrypt.hash(password, salt);
    })
    .then((passwordHashed) => {
      console.log("The hashed password is:", passwordHashed);
      User.create({
        username: username,
        password: passwordHashed,
      });
    })
    .then(() => {
      res.redirect("/user");
    })
    .catch((error) => {
      console.log("There is an error", error);
      if (error instanceof mongoose.Error.ValidationError) {
        res
          .status(500)
          .render("auth/signup", { errormessage: "error signing in" });
      } else if (error.code === 11000) {
        res.render("auth/signup", {
          errormessage:
            "There is already an account connected to this username",
        });
      } else {
        next(error);
      }
    });
});

router.get("/user", (req, res) => {
  console.log("redirect to the userprofile");
  res.render("user/userprofile");
});

//login the user
router.get("/login", isLoggedOut, (req, res) => {
  console.log("TRAVELING TO THE LOGIN PAGE");
  res.render("auth/login");
});

//middelware
router.get("/profile", isLoggedIn, (req, res) => {
  console.log("This is in my session ==>", req.session.currentuser);
  res.render("user/userprofile", req.session.currentuser);
});

router.post("/login", (req, res) => {
  console.log("Session =>", req.session);
  const { username, password } = req.body;

  //first check to see if the user filled in their username and password
  if (!username || !password) {
    res.render("auth/login", {
      errormessage: "please enter your username or password!",
    });
    return;
  }

  //second check to see if there is already an user with that username registered on the website
  User.findOne({ username })
    .then((user) => {
      console.log(user);
      if (!user) {
        res.render("auth/login", {
          errormessage: "Username not found! Please sign up!",
        });
      } else if (bcrypt.compareSync(password, user.password)) {
        req.session.currentuser = user;
        res.redirect("/user");
      } else {
        res.render("auth/login", { errormessage: "error password" });
      }
    })
    .catch((error) => {
      console.log("There is an error:", error);
    });

  router.post("/logout", (req, res, next) => {
    req.session.destroy((err) => {
      if (err) next(err);
      res.redirect("/login");
    });
  });
});
module.exports = router;
