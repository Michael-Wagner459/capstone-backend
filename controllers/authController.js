const jwt = require('jsonwebtoken');
const User = require('../models/user');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');

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

    res.redirect(process.env.FRONTEND_URL + '/email-verified');
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
        username: user.username,
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

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      domain: 'tabletop-tracker.com',
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(422).json({ message: 'Server error', error: err });
  }
};

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Get refreshToken from cookies

  if (!refreshToken) return res.sendStatus(401); // Unauthorized if no token is found

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    // Check if the user exists and the refresh token matches
    if (!user || user.refreshToken !== refreshToken) {
      return res.sendStatus(403); // Forbidden if the token doesn't match or the user is invalid
    }

    // Generate a new access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '5m' } // Short lifespan for access token
    );

    res.json({ accessToken }); // Send the new access token in response
  } catch (err) {
    return res.sendStatus(403); // Forbidden if token verification fails
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.cookies?.refreshToken;
  console.log('has cookie');
  try {
    // Check if the refreshToken exists
    if (refreshToken) {
      // Verify the refreshToken
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      // Find the user based on decoded token ID
      const user = await User.findById(decoded.id);

      // If user found, clear their stored refreshToken
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }

      // Clear the refreshToken cookie in both development and production environments
      console.log('tries to clear cookie');
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        domain: 'tabletop-tracker.com',
      });
    }

    res.status(200).send('Logged out successfully');
  } catch (err) {
    // Log detailed error message for better debugging
    res.status(422).json({ message: 'Error logging out', error: err });
  }
};
exports.validateToken = async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer Token
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    // Optionally fetch user details from the database here
    res.json({
      message: 'Token is valid',
      user: {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
      },
    });
  });
};
