const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const difficultySchema = new Schema({
  name: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
});

module.exports = mongoose.model('Difficulty', difficultySchema);
