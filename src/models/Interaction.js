const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  // User who made the interaction
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Post being interacted with
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },

  // Type of interaction
  type: {
    type: String,
    enum: ['like', 'dislike', 'comment'],
    required: true
  },

  // Comment text (only for type='comment')
  commentText: {
    type: String,
    maxlength: 1000,
    required: function() {
      return this.type === 'comment';
    }
  },

  // Time left for post to expire when interaction was made
  timeLeftAtInteraction: {
    type: Number, // milliseconds
    required: true
  },

  // Post status at time of interaction
  postStatusAtInteraction: {
    type: String,
    enum: ['Live', 'Expired'],
    required: true
  },

  // Post topic(s) at time of interaction
  postTopicsAtInteraction: [{
    type: String,
    enum: ['Politics', 'Health', 'Sport', 'Tech']
  }],

  // Additional metadata
  metadata: {
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

interactionSchema.index({ user: 1, createdAt: -1 });
interactionSchema.index({ post: 1, createdAt: -1 });
interactionSchema.index({ user: 1, type: 1 });
interactionSchema.index({ post: 1, type: 1 });
interactionSchema.index({ user: 1, post: 1, type: 1 });
interactionSchema.virtual('userName').get(function() {
  return this.user ? this.user.username : null;
});

interactionSchema.methods.toDisplay = function() {
  const display = {
    id: this._id,
    type: this.type,
    user: this.user,
    post: this.post,
    timeLeftAtInteraction: this.timeLeftAtInteraction,
    postStatusAtInteraction: this.postStatusAtInteraction,
    postTopicsAtInteraction: this.postTopicsAtInteraction,
    createdAt: this.createdAt
  };

  if (this.type === 'comment') {
    display.commentText = this.commentText;
  }

  return display;
};

interactionSchema.statics.getUserHistory = async function(userId, limit = 20) {
  return await this.find({ user: userId })
    .populate('post', 'title topics message')
    .populate('user', 'username email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

interactionSchema.statics.getPostHistory = async function(postId) {
  return await this.find({ post: postId })
    .populate('user', 'username email')
    .sort({ createdAt: -1 });
};

interactionSchema.statics.getUserPostInteraction = async function(userId, postId, type) {
  return await this.findOne({ user: userId, post: postId, type });
};


interactionSchema.set('toJSON', { virtuals: true });
interactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Interaction', interactionSchema);
