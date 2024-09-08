const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  // Check if the route is accessing general posts
  if (req.path.includes('/category/general')) {
    return next(); // Bypass authentication for general posts
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('Authorization header missing');
  }

  const token = authHeader.split(' ')[1];

  // Verify access token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
    }

    // Attach user to request object and proceed to the next middleware
    req.user = user;
    next();
  });
};
