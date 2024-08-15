const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//define User Model
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'mod', 'dm', 'player'], default: 'player' },
  isVerified: { type: Boolean, default: false },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
