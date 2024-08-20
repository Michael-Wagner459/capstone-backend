const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoute');
const postsRoutes = require('./routes/postsRoute');
const commentRoutes = require('./routes/commentsRoute');

const app = express();

//Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Routes
app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/comments', commentRoutes);

//Error handling middleware in case errors werent previously caught
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
