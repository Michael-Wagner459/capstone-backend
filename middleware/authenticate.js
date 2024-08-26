const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  //gets beared token out of the headers
  const token = req.headers.authorization?.split(' ')[1];

  //if no token it just returns next. This allows people not signed in to still view general category posts and comments
  //other role protection is done in the controllers
  if (!token) {
    return next();
  }

  try {
    //verifies token with jwt secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //decodes the token to allow access to information inside the token
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
};
