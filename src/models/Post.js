const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
  // Post title
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  // Post topics (can have multiple)
  topics: [{
    type: String,
    enum: ['Politics', 'Health', 'Sport', 'Tech'],
    required: true
  }],

  // Message body
  message: {
    type: String,
    required: [true, 'Message is required'],
    minlength: [10, 'Message must be at least 10 characters long'],
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },

  // Post owner reference
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Post expiration time
  expirationTime: {
    type: Date,
    required: [true, 'Expiration time is required']
  },

  // Post status
  status: {
    type: String,
    enum: ['Live', 'Expired'],
    default: 'Live'
  },

  // Likes array (stores user IDs who liked)
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Dislikes array (stores user IDs who disliked)
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Comments array
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true // Automatically creates createdAt and updatedAt
});


postSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

postSchema.virtual('dislikesCount').get(function() {
  return this.dislikes ? this.dislikes.length : 0;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

postSchema.virtual('totalInteractions').get(function() {
  const likesCount = this.likes ? this.likes.length : 0;
  const dislikesCount = this.dislikes ? this.dislikes.length : 0;
  return likesCount + dislikesCount;
});

postSchema.virtual('timeLeft').get(function() {
  const now = new Date();
  const timeLeft = this.expirationTime - now;
  return timeLeft > 0 ? timeLeft : 0; // Return 0 if already expired
});

postSchema.methods.isExpired = function() {
  return new Date() > this.expirationTime;
};

postSchema.methods.updateStatus = function() {
  if (this.isExpired() && this.status === 'Live') {
    this.status = 'Expired';
  }
  return this.status;
};

postSchema.pre('save', function(next) {
  this.updateStatus();
  next();
});

postSchema.pre(/^find/, function(next) {
  // Update expired posts status
  const now = new Date();
  this.model.updateMany(
    { expirationTime: { $lt: now }, status: 'Live' },
    { status: 'Expired' }
  ).exec();
  next();
});

postSchema.index({ topics: 1, status: 1, createdAt: -1 });
postSchema.index({ owner: 1 });
postSchema.index({ expirationTime: 1 });
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
