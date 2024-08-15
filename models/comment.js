const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', requried: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CommentModel = mongoose.model('Comment', CommentSchema);

module.exports = CommentModel;
