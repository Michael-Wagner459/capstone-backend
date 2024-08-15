const jwt = require('jsonwebtoken');

exports.authenticate = (res, res, next) => {
  //gets beared token out of the headers
  const token = req.headers.authorization?.split(' ')[1];

  //sends 401 if there is no token
  if (!token) {
    return res.status(401).send('No token provided');
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
