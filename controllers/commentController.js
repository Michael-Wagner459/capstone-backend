const Post = require('../models/post');
const Comment = require('../models/comment');
const roleCategoryMap = require('../config/roles');
const jwt = require('jsonwebtoken');

//create a new comment
exports.createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    //finds post by id that comment will be created under
    const post = await Post.findById(postId);
    //error handling if no post
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (!req.user) {
      return res.status(403).send('Please log in to add a comment');
    }
    //gets user role from jwt token.
    const userRole = req.user.role;
    //users role is indexed into the role category object and allowed roles is set to the roles that user can access
    const allowedCategories = roleCategoryMap[userRole];
    //error handling if user does have have permission based on his role
    if (!allowedCategories || !allowedCategories.includes(post.category)) {
      return res.status(403).send('You do not have permission to add a comment');
    }
    //makes new comment
    const comment = new Comment({
      content,
      author: req.user.id,
      post: postId,
    });
    //saves comment then pushes it into the posts.comments in the post schema then saves post
    await comment.save();
    post.comments.push(comment._id);
    await post.save();
    await comment.populate('author');
    res.status(201).json(comment);
  } catch (err) {
    res.status(422).json({ message: 'Error creating comment.', error: err });
  }
};

//gets all comments by post
exports.getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    // Error handling if no post
    if (!post) {
      return res.status(404).send('Post not found');
    }

    // Check if the post is in the general category
    if (post.category !== 'general') {
      const authHeader = req.headers.authorization;

      // If the user is not logged in
      if (!authHeader) {
        return res.status(401).send('Please log in to access this content.');
      }

      const token = authHeader.split(' ')[1];

      try {
        // Verify access token synchronously
        const user = jwt.verify(token, process.env.JWT_SECRET);
        // Attach user to request object
        req.user = user;
      } catch (err) {
        return res.status(401).json({
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        });
      }

      // Get user role from JWT token
      const userRole = req.user.role;
      // User's role is indexed into the role category object and allowed roles are set to the roles that user can access
      const allowedCategories = roleCategoryMap[userRole];

      // Error handling if user does not have permission based on their role
      if (!allowedCategories || !allowedCategories.includes(post.category)) {
        return res.status(403).send('You do not have permission to view these comments');
      }
    }

    // Finds all comments related to postId
    const comments = await Comment.find({ post: postId }).populate('author', 'username').sort({ createdAt: 1 });

    res.status(200).json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    if (!res.headersSent) {
      res.status(422).json({ message: 'Error fetching comments', error: err });
    }
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    //makes sure user is logged in
    if (!req.user) {
      return res.status(401).send('Please log in to access this content.');
    }

    //finds comment by id
    const comment = await Comment.findById(id);
    //error handling if no comment is found
    if (!comment) {
      return res.status(404).send('Comment not found.');
    }
    //error handling if someone else besides the user that made the comment tries updating it
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).send('Not authorized to update this comment.');
    }
    //sets the comment content to the new content or defaults to the original content then saves it
    comment.content = content;
    await comment.save();
    await comment.populate('author');
    res.status(200).json(comment);
  } catch (err) {
    res.status(422).json({ message: 'Error updating comment', error: err });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    //makes sure user is logged in
    if (!req.user) {
      return res.status(401).send('Please log in to access this content.');
    }

    //gets comment by Id
    const comment = await Comment.findById(id);
    //error handling if comment is not found
    if (!comment) {
      return res.status(404).send('Comment not found');
    }
    //makes sure that either the user that made the comment or an admin or mod is deleting the comment
    if (comment.author.toString() !== req.user.id && !['admin', 'mod'].includes(req.user.role)) {
      return res.status(403).send('You are not authorized to delete this comment');
    }
    //deletes the comment
    await comment.deleteOne();

    // Remove the comment ID from the associated post's comments array
    await Post.updateOne(
      { _id: comment.post },
      { $pull: { comments: id } } // Use $pull to remove the comment ID from the comments array
    );
    res.status(200).send('Comment delete successful');
  } catch (err) {
    res.status(422).json({ message: 'Error deleting comment', error: err });
  }
};
