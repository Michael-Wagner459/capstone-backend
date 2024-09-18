const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate } = require('../middleware/authenticate');

//routes for posts

//router to get all posts in a category
router.get('/category/:category', authenticate, postController.getPostsByCategory);

//get a single post by id
router.get('/:id', postController.getPostById);

//create post
router.post('/', authenticate, postController.createPost);

//update a post
router.put('/:id', authenticate, postController.updatePost);

//delete a post
router.delete('/:id', authenticate, postController.deletePost);

module.exports = router;
