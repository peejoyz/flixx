const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let blogSchema = new Schema({
    user:{
        _id: {
            type: String
        },
        name: {
            type: String
        },
        image: {
            type: String
        }
    },
    image: {
        type:String
    },
    title: {
        type: String
    },
    description: {
        type:String
    },
    views: {
        type: Number,
        default:0
    },
    likes: {
        type: Array
    },
    comments: {
        type: Array
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('blog', blogSchema);