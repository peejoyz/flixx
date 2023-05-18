const express = require('express');
const router = express();
const controller = require('../controllers/blogIndex');

router
.get('/blog', controller.displayPost)
.get('/single-post/:id', controller.getSinglePost)
//like post.
.post('/do-like-post', controller.postLikePost)
//comment
.post('/do-comment-post', controller.postCommentPost)
//reply to comment
.post('/do-comment-reply-post', controller.doReplyCommentPost)
.get('/posts/:_id', controller.getOtherPost)

module.exports = router;