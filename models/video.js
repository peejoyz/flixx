const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let videoSchema = new Schema({
    user:{
        _id: {
            type: String
        },
        name: {
            type: String
        },
        image: {
            type: String
        },
        subscribers: {
            type: Number
        }
    },
    filePath: {
        type:String
    },
    thumbnail: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type:String
    },
    tags: {
        type: String
    },
    category: {
        type: String
    },
    
    minutes: {
        type: Number
    },
    seconds: {
        type: Number
    },
    hours: {
        type: Number
    },
    watch: {
        type: Number
    },
    views: {
        type: Number,
        default:0
    },
    playlist: {
        type: String,
        default: ""
    },
    likes: {
        type: Array
    },
    dislikes: {
        type: Array,
    },
    comments: {
        type: Array
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('video', videoSchema);