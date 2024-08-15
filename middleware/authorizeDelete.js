const Post = require('../models/post');
const User = require('../models/user');
const Comment = require('../models/comment');
const mongoose = require('mongoose');

const authorizeDeletion = (model) => {
  const canDeletePostorComment = (resource, user) => {
    return resource.author.toString() === user._id.toString() || ['admin', 'mod'].includes(user.role);
  };

  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id).populate('author');
      if (!resource) return res.status(404).send('Component not found');

      if (!canDeletePostorComment(resource, req.user)) {
        return res.status(403).send('Not authorized to delete this');
      }

      req.resource = resource;
      next();
    } catch (err) {
      res.status(500).send('Server Error');
    }
  };
};

module.exports = authorizeDeletion;
