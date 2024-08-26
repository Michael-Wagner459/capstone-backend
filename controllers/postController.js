const Post = require('../models/post');
const Comment = require('../models/comment');
const roleCategoryMap = require('../config/roles');

//creates Post
exports.createPost = async (req, res) => {
  try {
    //gets user id from token
    const user = req.user.id;

    //if no user returns must login message
    if (!user) {
      return res.status(401).send('You must be logged in to add a post');
    }
    //grabs required fields from the body
    const { title, content, category } = req.body;

    //if required fields arent there sends back all required fields message
    if (!title || !content || !category) {
      return res.status(400).send('Please make sure all required fields are sent');
    }

    //gets user role from jwt token.
    const userRole = req.user.role;

    //users roll is indexed into the role category object and allowed roles is set to the roles that user can access
    const allowedCategories = roleCategoryMap[userRole];

    //if their role isnt found or they cannot view that role then message is sent back
    if (!allowedCategories || !allowedCategories.includes(category)) {
      return res.status(403).send('You do not have permission to add this post.');
    }

    //makes a new post
    const post = new Post({
      title,
      content,
      author: user,
      category,
    });

    //saves post
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(422).json({ message: 'Error creating post', error: err });
  }
};
//gets posts based on category. Doing this insteasd of a filter on the first since this is how they will be split up to view on the front end
exports.getPostsByCategory = async (req, res) => {
  try {
    //gets category or defaults to general since general can be viewed by everyone
    const category = req.params.category;
    //setting up role based protection
    if (category !== 'general') {
      //safe handling for if user is not logged in
      if (!req.user) {
        return res.status(401).send('You must be logged in to access this.');
      }

      //gets user role from jwt token.
      const userRole = req.user.role;

      //users roll is indexed into the role category object and allowed roles is set to the roles that user can access
      const allowedCategories = roleCategoryMap[userRole];

      //if their role isnt found or they cannot view that role then message is sent back
      if (!allowedCategories || !allowedCategories.includes(category)) {
        return res.status(403).send('You do not have permission to view this.');
      }
    }

    //grabs all the posts by category and sorts them from newest to oldest. populates their username
    const posts = await Post.find({ category }).sort({ createdAt: -1 }).populate('author', 'username');

    res.status(200).json(posts);
  } catch (err) {
    res.status(422).json({ message: 'Error fetching posts', error: err });
  }
};

//grabs a specific post by id
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    //finds post by id
    const post = await Post.findById(id).populate('author', 'username');
    //error handling if post does not exist
    if (!post) {
      return res.status(404).send('Post not found.');
    }
    //gets category of post
    const category = post.category;

    if (category !== 'general') {
      //safe handling for if user is not logged in
      if (!req.user) {
        return res.status(401).send('You must be logged in to access this.');
      }

      //gets user role from jwt token.
      const userRole = req.user.role;
      //users roll is indexed into the role category object and allowed roles is set to the roles that user can access
      const allowedCategories = roleCategoryMap[userRole];

      //if their role isnt found or they cannot view that role then message is sent back
      if (!allowedCategories || !allowedCategories.includes(category)) {
        return res.status(403).send('You do not have permission to view this.');
      }
    }

    res.status(200).json(post);
  } catch (err) {
    res.status(422).json({ message: 'Error fetching post', error: err });
  }
};
//updates a post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    //Only allowing the title and content to be changed. User will not be able to change the category once its first made.
    const { title, content } = req.body;

    //finds post by id
    const post = await Post.findById(id);
    //error handling if post does not exist
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (!req.user) {
      return res.status(401).send('You must be logged in to delete this.');
    }

    //error handling to make sure that the user is the one requesting to change the post. Even admins and mods will not have ability to change posts only delete
    if (post.author.toString() !== req.user.id) {
      return res.status(403).send('Not authorized to update this post.');
    }

    //if required fields arent entered it will default back to what it was before
    post.title = title || post.title;
    post.content = content || post.content;
    //saves post
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(422).json({ message: 'Error updating post', error: err });
  }
};

//deletes post
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    //finds post
    const post = await Post.findById(id);
    //error handling if the post does not exist
    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (!req.user) {
      return res.status(401).send('You must be logged in to delete this.');
    }

    //role protection. Makes sure either the user is deleting their post or that its a mod or admin.
    if (post.author._id.toString() !== req.user.id && !['admin', 'mod'].includes(req.user.role)) {
      return res.status(403).send('Not authorized to delete this post.');
    }
    //deletes post
    await post.deleteOne();

    //deletes comments associated with that post
    const comments = await Comment.find({ post: id });

    if (comments.length > 0) {
      await Comment.deleteMany({ post: id });
    }

    res.status(200).send('Post deleted successfully.');
  } catch (err) {
    res.status(422).json({ message: 'Error deleting post.', error: err });
  }
};
