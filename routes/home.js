const express = require('express');
const router = express();
const controller = require('../controllers/homeController');
const bodyParser = require('body-parser');
const {check} = require('express-validator');
let urlencodedParser = bodyParser.urlencoded({ extended: false});
let urlencodedParserLogin = bodyParser.urlencoded({ extended: false});
let urlencodedParserUpload = bodyParser.urlencoded({ extended: false});

urlencodedParser = [
    check('name', 'Name is required and not more than 40 characters long.')
        .notEmpty()
        .isLength({max: 40}),
    check('email', 'Email is required.')
        // .notEmpty()
        .isEmail(),
    check('password', 'Password is required.')
    .notEmpty()
]

urlencodedParserLogin = [
    check('email', 'Email is required.')
        // .notEmpty()
        .isEmail(),
    check('password', 'Password is required.')
    .notEmpty()
]

urlencodedParserUpload = [
    check('title', 'Title is required.')
        .notEmpty(),
    check('description', 'Description is required.')
    .notEmpty(),
    check('tags', 'Tags is required.')
        .notEmpty(),
    check('category', 'Category is required.')
    .notEmpty()
]

router
.get('/', controller.getHome)
.get('/signup', controller.getSignUp)
.post('/signup', urlencodedParser, controller.postSignUp)
.get('/login', controller.getLogin)
.post('/login', urlencodedParserLogin, controller.postLogin)
.get('/logout', controller.getLogout)
.get('/upload', controller.getUpload)
.post('/upload-video', urlencodedParserUpload, controller.postUpload)
.get('/watch/:watch', controller.getWatch)
.post('/do-like', controller.postLike)
.post('/do-comment', controller.postComment)
.get('/get_user', controller.getUser)
.post('/do-reply', controller.doReply)
.post('/do-subscribe', controller.subscribers)
.get('/get-related-videos/:category/:videoId', controller.getRelatedVideo)
.post('/save-history', controller.saveHistory)
.get('/watch-history', controller.watchHistory)
.post('/delete-from-history', controller.deleteHistory)
.get('/channel/:_id', controller.getChannel)
.post('/change-profile-picture', controller.postProfilePicture)
.post('/change-cover-picture', controller.postCoverPicture)
.get('/edit/:watch', controller.editVideo)
.post('/edit', controller.postEditVideo)
.post('/delete-video', controller.deleteVideo)
.post('/create-playlist', controller.postPlaylist)
.get('/playlist/:_id/:watch', controller.getPlaylist)
.post('/delete-playlist', controller.deletePlaylist)
.get('/my_subscriptions', controller.getSubscription)
.post('/remove-channel-from-subscription', controller.removeSubscription)
.get('/category_search/:query', controller.categorySearch)
.get('/tag_search/:query', controller.getTags)
.get('/search', controller.search)
.get('/settings', controller.settings)
.post('/save_settings', controller.postSettings)
module.exports = router;