const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  filename: {
    required: true,
    type: String,
  },
  fileId: {
    required: true,
    type: String,
  },
  createdAt: {
    default: Date.now(),
    type: Date,
  },
});

const Media = mongoose.model('Media', MediaSchema);

module.exports = Media;
