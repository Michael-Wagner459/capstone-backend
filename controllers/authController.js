const jwt = require('jsonwebtoken');
const User = require('../models/user');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');
const { access } = require('fs');

//register a new user
exports.register = async (req, res) => {
  //items needed to create a new user
  const { username, email, password, role } = req.body;

  // Function to hash the email
  function hashEmail(email) {
    return crypto.createHash('sha256').update(email).digest('hex');
  }

  if (!username || !email || !password || !role) {
    return res.status(400).send('Must provide all username, email, password, and role');
  }
  try {
    const hashedEmail = hashEmail(email);
    const existingUser = await User.findOne({ hashedEmail });

    if (existingUser) {
      return res.status(409).send('Email is already in use');
    }
    //makes new user and makes verification token
    const user = new User({
      username,
      email,
      hashedEmail,
      password,
      role,
      verificationToken: crypto.randomBytes(20).toString('hex'),
    });
    //saves user then sends out verification email
    await user.save();
    sendVerificationEmail(user);

    res.status(201).send('User registered, Please check your email to verify your account');
  } catch (err) {
    res.status(422).json({ message: 'Server error', error: err });
  }
};

//verify email
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  try {
    //finds user by access token
    const user = await User.findOne({ verificationToken: token });
    //error handling for if token does not exist or expires
    if (!user) {
      return res.status(400).send('Invalid or expired token');
    }
    //changes verification status and changes token to undefined then saves user
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).send('Email verified.');
  } catch (err) {
    res.status(422).json({ message: 'Server error', error: err });
  }
};

//Login user
exports.login = async (req, res) => {
  //username and password sent from the user
  const { username, password } = req.body;

  try {
    //finds user by username
    const user = await User.findOne({ username });

    //if user or password is incorrect sends an error
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send('Invalid credentials');
    }
    //if user hasnt verified his email yet sends an error
    if (!user.isVerified) {
      return res.status(401).send('Please verify email before you can log in');
    }

    //token that is given to the user when they sign in that has there id and role for role protected routes
    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    //generate refresh token
    const refreshToken = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ accessToken });
  } catch (err) {
    res.status(422).json({ message: 'Server error', error: err });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.sendStatus(403);
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '5m' } // Short lifespan for access token
    );

    res.json({ accessToken });
  } catch (err) {
    return res.sendStatus(403);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).send('Logged out successfully');
};
