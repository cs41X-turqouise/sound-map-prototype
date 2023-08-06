const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  google: {
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
  },
  roles: {
    type: [String],
    enum: ['user', 'admin', 'superadmin'],
    default: ['user'],
  },
  bookmarks: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Media',
  },
  uploads: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Media',
  },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
