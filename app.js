const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoute');
const postsRoutes = require('./routes/postsRoute');
const commentRoutes = require('./routes/commentsRoute');

const app = express();

//Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
