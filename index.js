const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config();

//server setup
const PORT = process.env.PORT || 8080;

//DB Setup
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected successfully');
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error', err);
  });
