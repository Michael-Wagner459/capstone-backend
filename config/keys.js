//enviroment variables to use depending if in production mode or devlopment mode

if (process.env.NODE_ENV === 'production') {
  //keys returned if website is being deployed for production
  module.exports = require('./prod');
} else {
  //keys returned if website is being deployed for development
  module.exports = require('./dev');
}
