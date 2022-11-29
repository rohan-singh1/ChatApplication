const login_model = require("../models/login_schema.js");
const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const authenticate_inputs = require("../../src/auth_inputs");

const initialize_login = async (passport) => {
  passport.use(
    new localStrategy({ usernameField: "email" }, (email, password, done) => {
      login_model.findOne({ email: email }, async (err, user) => {
        if (err) {
          console.log(err);
          return done(err);
        }
        if (!user) {
          console.log("No user with that email.");
          return done(null, false, {
            message: "No user found with that email.",
          });
        }

        //Compare found password
        const compared_pass = await bcrypt.compare(password, user.password);
        if (!compared_pass) {
          console.log("Incorrect pass");
          return done(null, false, { message: "Incorrect password!" });
        } else {
          console.log("Successful");
          return done(null, user);
        }
      });
    })
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    login_model.findById(id, (err, user) => {
      done(err, user);
    });
  });
};

const redirect_not_auth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  else res.redirect("/login");
};

const redirect_auth = (req, res, next) => {
  if (req.isAuthenticated()) return res.redirect("/");
  else return next();
};

const save_user = async (req, res) => {
  try {
    const body = req.body;
    const errors = authenticate_inputs(body);
    console.log('returned errors => ', errors);
    const existing_user = await login_model.find({ email: req.body.email });
    if (!existing_user[0]) {
      //if not, add them to the database
      const pass_hash = await bcrypt.hash(req.body.password, 10);

      const response = await login_model.create({
        username: req.body.name,
        email: req.body.email,
        password: pass_hash,
        uuid: uuidv4(),
      });

      console.log(`document that was added =>`, response);
      res.redirect("/login");
    } else {
      //Needs an error to let them know that it's already in the database
      res.redirect("/register");
    }
  } catch (err) {
    console.log(err);
    res.redirect("/register");
  }
};

module.exports = {
  initialize_login,
  redirect_auth,
  redirect_not_auth,
  save_user,
};