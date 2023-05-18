const express = require('express');
const router = express();
const controller = require('../controllers/blogController');
const bodyParser = require('body-parser');
const {check, validationResult} = require('express-validator');
let urlencodedParser = bodyParser.urlencoded({ extended: false});

urlencodedParser = [
    check('title', 'Title is required and not more than 40 characters long.')
        .notEmpty()
        .isLength({max: 40}),
    check('description', 'Description is required.')
        .notEmpty()
]

router
.get('/add-post', controller.getAddPost)
.get('/:_id', controller.getBlog)
.post('/add-post', urlencodedParser, controller.postAddPost)
.get('/edit-post/:id', controller.editPost)
.post('/edit-post/:id', urlencodedParser, controller.postEditPost)
.get('/delete-post/:id', controller.deletePost)

module.exports = router;