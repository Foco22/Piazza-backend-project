const Post = require('../models/Post');
const User = require('../models/User');
const Interaction = require('../models/Interaction');

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = async (req, res) => {
  try {
    const { title, topics, message, expirationMinutes } = req.body;

    // Calculate expiration time
    const expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Create post
    const post = await Post.create({
      title,
      topics,
      message,
      owner: req.user._id,
      expirationTime
    });

    // Populate owner information
    await post.populate('owner', 'username email');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating post',
      error: error.message
    });
  }
};

/**
 * @desc    Get all posts or filter by topic
 * @route   GET /api/posts?topic=Tech&status=Live
 * @access  Public
 */
const getPosts = async (req, res) => {
  try {
    const { topic, status } = req.query;

    // Build query
    const query = {};

    if (topic) {
      query.topics = topic;
    }

    if (status) {
      query.status = status;
    }

    // Get posts
    const posts = await Post.find(query)
      .populate('owner', 'username email')
      .populate('likes', 'username')
      .populate('dislikes', 'username')
      .populate('comments.user', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: { posts }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching posts',
      error: error.message
    });
  }
};

/**
 * @desc    Get single post by ID
 * @route   GET /api/posts/:id
 * @access  Public
 */
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('owner', 'username email')
      .populate('likes', 'username')
      .populate('dislikes', 'username')
      .populate('comments.user', 'username');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { post }
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching post',
      error: error.message
    });
  }
};

/**
 * @desc    Like a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is expired
    if (post.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot like an expired post'
      });
    }

    // Check if user is the owner of the post
    if (post.owner.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot like your own post'
      });
    }

    // Check if user already liked
    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      // Remove like from post
      post.likes = post.likes.filter(
        userId => userId.toString() !== req.user._id.toString()
      );

      // Delete the interaction record
      await Interaction.findOneAndDelete({
        user: req.user._id,
        post: post._id,
        type: 'like'
      });
    } else {
      // Add like to post and remove dislike if exists
      post.likes.push(req.user._id);
      post.dislikes = post.dislikes.filter(
        userId => userId.toString() !== req.user._id.toString()
      );

      // Remove any existing dislike interaction
      await Interaction.findOneAndDelete({
        user: req.user._id,
        post: post._id,
        type: 'dislike'
      });

      // Create interaction record with metadata
      await Interaction.create({
        user: req.user._id,
        post: post._id,
        type: 'like',
        timeLeftAtInteraction: post.timeLeft,
        postStatusAtInteraction: post.status,
        postTopicsAtInteraction: post.topics
      });
    }

    await post.save();
    await post.populate('owner', 'username email');
    await post.populate('likes', 'username');
    await post.populate('dislikes', 'username');

    res.status(200).json({
      success: true,
      message: alreadyLiked ? 'Like removed' : 'Post liked',
      data: {
        post,
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while liking post',
      error: error.message
    });
  }
};

/**
 * @desc    Dislike a post
 * @route   POST /api/posts/:id/dislike
 * @access  Private
 */
const dislikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is expired
    if (post.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot dislike an expired post'
      });
    }

    // Check if user is the owner of the post
    if (post.owner.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot dislike your own post'
      });
    }

    // Check if user already disliked
    const alreadyDisliked = post.dislikes.includes(req.user._id);

    if (alreadyDisliked) {
      // Remove dislike from post
      post.dislikes = post.dislikes.filter(
        userId => userId.toString() !== req.user._id.toString()
      );

      // Delete the interaction record
      await Interaction.findOneAndDelete({
        user: req.user._id,
        post: post._id,
        type: 'dislike'
      });
    } else {
      // Add dislike to post and remove like if exists
      post.dislikes.push(req.user._id);
      post.likes = post.likes.filter(
        userId => userId.toString() !== req.user._id.toString()
      );

      // Remove any existing like interaction
      await Interaction.findOneAndDelete({
        user: req.user._id,
        post: post._id,
        type: 'like'
      });

      // Create interaction record with metadata
      await Interaction.create({
        user: req.user._id,
        post: post._id,
        type: 'dislike',
        timeLeftAtInteraction: post.timeLeft,
        postStatusAtInteraction: post.status,
        postTopicsAtInteraction: post.topics
      });
    }

    await post.save();
    await post.populate('owner', 'username email');
    await post.populate('likes', 'username');
    await post.populate('dislikes', 'username');

    res.status(200).json({
      success: true,
      message: alreadyDisliked ? 'Dislike removed' : 'Post disliked',
      data: {
        post,
        likesCount: post.likesCount,
        dislikesCount: post.dislikesCount
      }
    });
  } catch (error) {
    console.error('Dislike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while disliking post',
      error: error.message
    });
  }
};

/**
 * @desc    Add comment to a post
 * @route   POST /api/posts/:id/comment
 * @access  Private
 */
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is expired
    if (post.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot comment on an expired post'
      });
    }

    // Add comment to post
    post.comments.push({
      user: req.user._id,
      text
    });

    // Create interaction record with metadata
    await Interaction.create({
      user: req.user._id,
      post: post._id,
      type: 'comment',
      commentText: text,
      timeLeftAtInteraction: post.timeLeft,
      postStatusAtInteraction: post.status,
      postTopicsAtInteraction: post.topics
    });

    await post.save();
    await post.populate('owner', 'username email');
    await post.populate('likes', 'username');
    await post.populate('dislikes', 'username');
    await post.populate('comments.user', 'username');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        post,
        commentsCount: post.commentsCount
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding comment',
      error: error.message
    });
  }
};

/**
 * @desc    Get most active post by topic (highest likes + dislikes)
 * @route   GET /api/posts/most-active/:topic
 * @access  Public
 */
const getMostActivePost = async (req, res) => {
  try {
    const { topic } = req.params;

    // Find all live posts for the topic
    const posts = await Post.find({
      topics: topic,
      status: 'Live'
    })
      .populate('owner', 'username email')
      .populate('likes', 'username')
      .populate('dislikes', 'username')
      .populate('comments.user', 'username');

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active posts found for topic: ${topic}`
      });
    }

    // Find post with highest interactions
    let mostActivePost = posts[0];
    let maxInteractions = mostActivePost.totalInteractions;

    for (const post of posts) {
      if (post.totalInteractions > maxInteractions) {
        maxInteractions = post.totalInteractions;
        mostActivePost = post;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        post: mostActivePost,
        totalInteractions: maxInteractions
      }
    });
  } catch (error) {
    console.error('Get most active post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching most active post',
      error: error.message
    });
  }
};

/**
 * @desc    Get expired posts by topic
 * @route   GET /api/posts/expired/:topic
 * @access  Public
 */
const getExpiredPosts = async (req, res) => {
  try {
    const { topic } = req.params;

    const query = {
      status: 'Expired'
    };

    if (topic) {
      query.topics = topic;
    }

    const posts = await Post.find(query)
      .populate('owner', 'username email')
      .populate('likes', 'username')
      .populate('dislikes', 'username')
      .populate('comments.user', 'username')
      .sort({ expirationTime: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: { posts }
    });
  } catch (error) {
    console.error('Get expired posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expired posts',
      error: error.message
    });
  }
};

/**
 * @desc    Get user's interaction history
 * @route   GET /api/posts/interactions/my-history
 * @access  Private
 */
const getMyInteractions = async (req, res) => {
  try {
    const interactions = await Interaction.getUserHistory(req.user._id, 50);

    res.status(200).json({
      success: true,
      count: interactions.length,
      data: { interactions }
    });
  } catch (error) {
    console.error('Get interactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching interactions',
      error: error.message
    });
  }
};

/**
 * @desc    Get all interactions for a specific post
 * @route   GET /api/posts/:id/interactions
 * @access  Public
 */
const getPostInteractions = async (req, res) => {
  try {
    const interactions = await Interaction.getPostHistory(req.params.id);

    res.status(200).json({
      success: true,
      count: interactions.length,
      data: { interactions }
    });
  } catch (error) {
    console.error('Get post interactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching post interactions',
      error: error.message
    });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPost,
  likePost,
  dislikePost,
  addComment,
  getMostActivePost,
  getExpiredPosts,
  getMyInteractions,
  getPostInteractions
};
