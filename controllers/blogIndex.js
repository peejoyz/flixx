const mongoose = require('mongoose');
const User = require('../models/user');
const Blog = require('../models/blog');
const ObjectId = mongoose.Types.ObjectId;

function getUser(id, callBack) {
    User.findOne({
        "_id": new ObjectId(id)
    }).then((user) => {
        callBack(user)
    })
}

//displaying all blog post
exports.displayPost = async (req, res) => {

    try {
        let page = 1;
        if(req.query.page) {
            page = req.query.page;
        }
        const limit = 3;
        const postsData = await Blog.find({})
        .sort({createdAt: -1})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec()

        const count = await Blog.find({})
        .countDocuments();

        getUser(req.session.user_id, (user) => {
            res.render('blog/index', {
                isLogin: req.session.user_id ? true : false, 
                postsData,
                totalPages: Math.ceil(count/limit),
                currentPage: page,
                user: user,
                title: 'Flixx | Blog'
            })
        })
        
    } catch (error) {
        console.log(error.message)
    }
}

//displaying each blog post
exports.getSinglePost = async (req, res) => {
    await Blog.find({_id: req.params.id})
    .then((posts) => {
        if(posts == null) {
            res.send("Post does not exists"); 
        } else {
            //increment post views
            Blog.findByIdAndUpdate({_id: req.params.id}, {
                $inc: {views: 1}}, {new: true}
            )
            getUser(req.session.user_id, (user) => {
                res.render('blog/singlepost', {
                    isLogin: req.session.user_id ? true : false, 
                    posts: posts,
                    user: user
                })
            })
        }
    }).catch((err) => {
        console.log(err.message)
    })
}

//do-like-post
exports.postLikePost = async (req, res) => {
    if(req.session.user_id) {
        Blog.findOne({
            "_id": new ObjectId(req.body.postId),
            "likes._id": req.session.user_id
        })
        .then((posts) => {
            if(posts == null) {
                //push in likes array
                Blog.updateOne({
                    "_id": new ObjectId(req.body.postId)
                }, {
                    $push: {
                        likes: {
                            _id: req.session.user_id
                        }
                    }
                })
                .then((data) => {
                    res.json({
                        status: "success",
                        message: "Post Liked."
                    });
                }).catch((err) => {
                    console.log(err.message)
                })
            } else {
                Blog.updateOne({
                    "_id": new ObjectId(req.body.postId)
                }, {
                    $pull: {
                        likes: {
                            _id: req.session.user_id
                        }
                    }
                })
                .then((data) => {
                    res.json({
                        status: "alreadyliked",
                        message: "Post Unliked."
                    });
                }).catch((err) => {
                    console.log(err.message)
                })
            }
        })
    } else {
        res.json({
            status: "error",
            message: "Please Login to like this post"
        })
    }
}

//Do comment on post
exports.postCommentPost = async (req, res) => {
    if(req.session.user_id) {
        getUser(req.session.user_id, (user) => {
            Blog.findOneAndUpdate({
                "_id": new ObjectId(req.body.postId)
            }, {
                $push: {
                    comments: {
                        _id: new ObjectId(),
                        user: {
                            _id: user._id,
                            name: user.name,
                            image: user.image
                        },
                        comment: req.body.comment,
                        createdAt: new Date().getDate() + "-" + new Date().getMonth() + 1 + "-" + new Date().getFullYear(),
                        time: new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds(),
                        replies: []
                    }
                } 
            }).then((data) => {
                res.json({
                    status: "success",
                    message: "Comment been posted.",
                    user: {
                        _id: user._id,
                        name: user.name,
                        image: user.image
                    }
                })
            }).catch((err) => {
                console.log(err.message)
            })
        })
    } else {
        res.json({
            status: "error",
            message: "Please Login"
        })
    }
}

//Reply to comment
exports.doReplyCommentPost = async (req, res) => {
    if(req.session.user_id) {
        let reply = req.body.reply;
        let commentId = req.body.commentId;

        getUser(req.session.user_id, (user) => {
            Blog.findOneAndUpdate({
                "comments._id": new ObjectId(commentId)
            }, {
                $push: {
                    "comments.$.replies": {
                        _id: new ObjectId(),
                        user: {
                            _id: user._id,
                            name: user.name,
                            image: user.image
                        },
                        reply: reply,
                        createdAt: new Date().getDate() + "-" + new Date().getMonth() + "-" + new Date().getFullYear(),
                        time: new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds(),
                    }
                }
            }).then((data) => {
                res.json({
                    status: "success",
                    message: "Reply has been posted.",
                    user: {
                        _id: user._id,
                        name: user.name,
                        image: user.image
                    }
                })
            }).catch((err) => {
                console.log(err.message)
            })
        })
    } else {
        res.json({
            status: "error",
            message: "Please login to perform this action."
        })
    }
}

//Other post by user
exports.getOtherPost = async (req, res) => {
    try {
       User.findById({_id: req.params._id})
       .then((user) => {
            res.render('blog/other_posts', {
                user: user,
                isMyPost: req.session.user_id == req.params._id,
                isLogin: req.session.user_id ? true : false 
            })
       }).catch((err) => {
        console.log(err.message)
       }) 
    } catch (error) {
        console.log(error.message)
    }
}