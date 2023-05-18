const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    coverPhoto: String,
    image: String,
    subscribers: {
        type: Number,
        default: 0
    },
    subscriptions: Array,
    playlists: Array,
    videos: Array,
    history: Array,
    blog: Array
});

module.exports = mongoose.model('user', userSchema);