const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//define Post Model
const PostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['general', 'dm', 'player'], requried: true },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PostModel = mongoose.model('Post', PostSchema);

module.exports = PostModel;
