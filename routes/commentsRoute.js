const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/authenticate');

//routes for comments

//get comments by postID
router.get('/post/:postId', authenticate, commentController.getCommentsByPost);

//create a new comment
router.post('/', authenticate, commentController.createComment);

//update a new comment
router.put('/:id', authenticate, commentController.updateComment);

//delete a comment
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;
