const mongoose = require('mongoose');
const User = require('../models/user');
const Blog = require('../models/blog');
const bodyParser = require('body-parser');
const fs = require('fs');
const {validationResult} = require('express-validator');
const urlencodedParser = bodyParser.urlencoded({ extended: false});
const ObjectId = mongoose.Types.ObjectId;


//a function to return user's document.
function getUser(id, callBack) {
    User.findOne({
        "_id": new ObjectId(id)
    }).then((user) => {
        callBack(user)
    })
}

//Get all blog post
exports.getBlog = async (req, res) => {
    let count;

    Blog.count()
    .then((c) => {
        count = c;
    }).catch((err) => {
        console.log(err.message)
    })

    User.findById({_id: req.params._id})
    .then((user) => {
        getUser(req.session.user_id, (user) => {
            if(user == null) {
                res.render("home/login", {
                    title:  'Flixx | Login'
                })
            } else {
                res.render('blog/posts', {
                    isLogin: req.session.user_id ? true : false,
                    user: user,
                    isMyBlog: req.session.user_id == req.params._id,
                    count: count,
                    title2: 'Flixx | blog post'
                })
            }
        })
    }).catch((err) => {
        console.log(err.message);
    })
}

exports.getAddPost = async (req, res) => {
    if(req.session.user_id) {
        let title = '';
        let description = '';
        let image = '';
        let views = '';
        let likes = '';
        let comment = '';
        // let message = '';
        getUser(req.session.user_id, (user) => {
            res.render('blog/add_post', {
                title2 : 'Flixx | Add a post',
                title: title,
                description: description,
                image : image,
                views,
                likes,
                comment,
                message: '',
                success: '',
                user: user
            })
        })
    } else {
        res.redirect("/login")
    }
}

//post post
exports.postAddPost = async (req, res) => {
    if(req.session.user_id) {
        if(!req.files) {
            let title = '';
            let description = '';
            let image = '';
            let views = '';
            let likes = '';
            let comment = '';
            let message = '';
            req.flash('danger', 'Pls check the fields and uplaod an image')
            res.render('blog/add_post', {
                message,
                title2 : 'Flixx | Add a post',
                title : title,
                description: description,
                image : image,
                views,
                likes,
                comment
            })
        } else {
            let message = '';
            let success = '';
            let title = req.body.title;
            let description = req.body.description;
            let uploadedFile = req.files.image;
            let image_name = uploadedFile.name;
            let fileExtension = uploadedFile.mimetype.split('/')[1];
            image_name = uploadedFile.name; 
            let views;
            let likes;
            let comment;

            const errors = validationResult(req)

            if(!errors.isEmpty()) {
                const alert = errors.array()

                res.render('blog/add_post', {
                    message,
                    alert,
                    title2 : 'Flixx | Add a post',
                    title : title,
                    description: description,
                    image : image_name,
                    views,
                    likes,
                    comment
                })
            } else {
                Blog.findOne({title: title})
                .then((blog) => {
                    if(blog) {
                        req.flash('danger', 'Title exists, choose another.')
                        res.render('blog/add_post', {
                            title2 : 'Flixx | Add a post',
                            title : title,
                            description: description,
                            image : image_name,
                            views,
                            likes,
                            comment
                        })
                    } else {
                        if(uploadedFile.mimetype === 'image/png' || uploadedFile.mimetype === 'image/jpg' || uploadedFile.mimetype === 'image/jpeg') {
                            let pathImage = `public/postsPictures/${image_name}`;
                            let path2 = `/postsPictures/${image_name}`;
                            uploadedFile.mv(pathImage, (err) => {
                                if(err) 
                                    return console.log(err);  
                            })
                            getUser(req.session.user_id, (user) => {
                                let blog = new Blog({
                                    user: {
                                        _id: user._id,
                                        name: user.name,
                                        image: user.image,
                                    },
                                    title: title,
                                    description: description,
                                    image: path2,
                                    views: 0,
                                    likes: [],
                                    comment: []
                                });

                                blog.save()
                                .then((data) => {
                                    User.findOneAndUpdate({_id: new ObjectId(req.session.user_id)}, {
                                        $push: {
                                            blog: {
                                                _id: data._id,
                                                title: title,
                                                views: 0,
                                                description: description,
                                                image: path2
                                            }
                                        } 
                                    }).exec();
                                }).catch((err) => {
                                    console.log(err.message)
                                })
                                req.flash('success', 'Post Added!');
                                res.redirect('/blog/posts/' + user._id)
                            })
                        } else {
                            message = "Invalid File format. Only 'jpg' and 'png' images are allowed.";
                            res.render('blog/add_post', {
                                message,
                            }) 
                        }
                    }
                }).catch((err) => {
                    console.log(err.message)
                })
            }
        }
    } else {
        res.redirect("/login")
    }
}

//Get Edit Post
exports.editPost = async (req, res) => {
    if(req.session.user_id) {
        Blog.findById(req.params.id)
        .then((b) => {
            getUser(req.session.user_id, (user) => {
                res.render('blog/edit_post', {
                    title2: 'Flixx | Edit Post',
                    title: b.title,
                    description: b.description,
                    image: b.image,
                    id: b._id,
                    message : '',
                    user: user
                })
            })  
        }).catch((err) => {
            console.log(err.message)
        })
    } else {
        res.redirect("/login")
    }
}

//Post Edit Post
exports.postEditPost = async (req, res) => {
    try{
        if(req.session.user_id) {
            let imageFile = typeof req?.files?.image !== "undefined" ? req.files.image.name : "";
            
            let message = '';
            let title = req.body.title;
            let description = req.body.description;
            let bimage = req.body.bimage;
            let id = req.params.id;

            const errors = validationResult(req)

            if(!errors.isEmpty()) {
                const alert = errors.array()
                getUser(req.session.user_id, (user) => {
                    res.render('blog/edit_post', {
                        title2: 'Flixx | Edit Post',
                        message,
                        alert,
                        title : title,
                        description: description,
                        image : bimage,
                        id: id,
                        user: user
                    })
                })
                
            } else {
                getUser(req.session.user_id, (user) => {
                    Blog.findOne({title: title, _id:{'$ne': id}})
                    .then((b) => {
                        if(b) {
                            req.flash('danger', 'Blog title already exists')
                            res.redirect('/blog/posts/edit-post/' + user._id)
                        } else {
                            Blog.findById(id)
                            .then((b) => {
                                b.title = title;
                                b.description = description
                                if(imageFile != "") {
                                    let newPath = '/postsPictures/' + imageFile;
                                    b.image =  newPath;
                                }
                                User.findOneAndUpdate({
                                    "blog._id": new ObjectId(b._id)                  
                                }, {
                                    $set: {
                                        "blog.$.title": req.body.title, 
                                        "blog.$.description": req.body.description,
                                        "blog.$.image": b.image
                                    }}, {new: true}
                                ).then((response) => {
                                    res.status(200).send()
                                }).catch((err) => {
                                    console.log(err.message)
                                })

                                b.save()
                                .then(() => {
                                    if(imageFile != "") {
                                        if(bimage != "") {
                                            fs.unlink('public/' + bimage, (err) => {
                                                if(err)
                                                    console.log(err);
                                            });
                                        }

                                        let uploadedFile = req.files.image;
                                        let image_name = uploadedFile.name;
                                        let fileExtension = uploadedFile.mimetype.split('/')[1];

                                        if(uploadedFile.mimetype === 'image/jpg' || uploadedFile.mimetype === 'image/png' || uploadedFile.mimetype === 'image/jpeg') {
                                            let path = `public/postsPictures/${image_name}`;
                                            let newPathh = `/postsPictures/${image_name}`;

                                            uploadedFile.mv(path, (err) => {
                                                if(err) 
                                                    console.log(err);
                                                User.findOneAndUpdate({
                                                    "blog._id": new ObjectId(b._id)
                                                }, {
                                                    $set: {
                                                        "blog.$.title": req.body.title, 
                                                        "blog.$.description": req.body.description,
                                                        "blog.$.image": newPathh
                                                    }}, {new: true}
                                                ).then((response) => {
                                                    res.status(200).send()
                                                }).catch((err) => {
                                                    console.log(err.message)
                                                })
                            
                                            })
                                        } else {
                                            message = "Invalid File format. Only 'jpg' and 'png' images are allowed.";
                                            res.render('blog/posts/edit-post/' + user._id, {
                                                message,
                                            })
                                        }
                                    }
                                
                                }).catch((err) => {
                                    console.log(err.message)
                                })
                                req.flash('success', 'Post edited successfully!');
                                res.redirect('/blog/posts/' + user._id);
                            })
                        }
                    }).catch((err) => {
                        console.log(err.message)
                    })
                })
            }

        } else {
            res.redirect("/login")
        }
    } catch(error) {
        console.log(error.message)
    }
}

//delete post
exports.deletePost = async (req, res) => {
    if(req.session.user_id) {
        let id = req.params.id;

        getUser(req.session.user_id, (user) => {
            Blog.findByIdAndDelete(id)
            .then((b) => {
                fs.unlink('public/' + b.image, (err) => {
                    if(err)
                        console.log(err)
                })

                User.updateOne({
                    $and: [{
                        "_id": new ObjectId(req.session.user_id)
                    }, {
                        "blog._id": new ObjectId(b._id)
                    }]
                }, {
                    $pull: {
                        blog: {
                            "_id": new ObjectId(b._id)
                        }
                    }
                }).exec()
            }).catch((err) => {
                console.log(err.message)
            })
            req.flash('success', 'Post deleted successfully');
            res.redirect('/blog/posts/' + user._id);
        })
    } else {
        res.redirect("/login")
    }
}