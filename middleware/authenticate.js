const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('Authorization header missing');
  }

  const token = authHeader.split(' ')[1];

  // Verify access token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // If the token is expired or invalid, return an error
      if (err.name === 'TokenExpiredError') {
        return res.status(401).send('Access token expired');
      }
      return res.status(403).send('Invalid token');
    }

    // Attach user to request object and proceed to the next middleware
    req.user = user;
    next();
  });
};
