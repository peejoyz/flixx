const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Video = require('../models/video');
const fs = require('fs');
const { validationResult } = require('express-validator');
const { getVideoDurationInSeconds } = require('get-video-duration');
const ObjectId = mongoose.Types.ObjectId;

//a function to return user's document.
function getUser(id, callBack) {
    User.findOne({
        "_id": new ObjectId(id)
    }).then((user) => {
        callBack(user)
    })
}

//Home
exports.getHome = async (req, res) => {
    // res.send('Home')
    let home = Video.find({}).sort({"createdAt": -1});
    let home2 = Video.find({}).sort({"views": -1});

    let promise = home.exec();
    let promise2 = home2.exec();

    promise.then(videos => {
        promise2.then((videos2) => {
            getUser(req.session.user_id, (user) => {
                res.render('home/index', {
                    isLogin: req.session.user_id ? true : false,
                    videos: videos,
                    videos2: videos2,
                    title: "Flixx | Exploration at its best",
                    user: user
                })
            })
        }).catch((err) => {
            console.log(err.message)
        })  
    }).catch((err) => {
        console.log(err.message)
    })
}

exports.getSignUp = async (req, res) => {
    res.render('home/signup', {
        title:  'Flixx | Signup'
    });
}

exports.postSignUp = async (req, res) => {
    try {
        let name = req.body.name;
        let email = req.body.email;
        let password = req.body.password;
        let coverPhoto;
        let image;
        let subscribers;
        let subscriptions;
        let playlists;
        let videos;
        let history;
        let notifications;

        const errors = validationResult(req)

        if(!errors.isEmpty()) {
            const alert = errors.array()

            res.render('home/signup', {
                alert,
                title:  'Flixx | Signup'
            })
        } else {
            //check if email already exists
            User.findOne({email: email})
            .then((user) => {
                if(user == null) {
                    bcrypt.hash(req.body.password, 10, function(err, hash) {
                        let user = new User({
                            name: name,
                            email: email,
                            password: hash,
                            coverPhoto: "",
                            image: "",
                            subscribers: 0,
                            subscriptions: [], //channels i have subscribed
                            playlists: [],
                            videos: [],
                            history: []
                            
                        })
                        user.save();
                            req.flash('success', 'Successfully signed up. Welcome on board!');
                            res.redirect('/login');      
                    })
                } else {
                    req.flash('danger', 'Sorry the email already exists, choose another.');
                    res.redirect('/signup')
                }
            })
            
        }
    } catch (error) {
        console.log(error.message)
    }
}

exports.getLogin = (req, res) => {
    res.render('home/login', {
        title:  'Flixx | Login'
    });
}

//postLogin
exports.postLogin = async (req, res) => {
    const errors = validationResult(req)

    if(!errors.isEmpty()) {
        const alert = errors.array()

        res.render('home/login', {
            alert,
            title:  'Flixx | Login'
        })
    } else {
        //check if email exixts
        await User.findOne({email: req.body.email})
        .then((user) => {
            if(user == null) {
                req.flash('danger', 'Email does not exists');
                res.redirect('/login');
            } else {
                //compare hashed password
                bcrypt.compare(req.body.password, user.password, function(err, isVerify){
                    if(isVerify) {
                        //save user ID in session
                        req.session.user_id = user._id;
                        res.redirect("/")
                    } else {
                        // res.send("Password is not correct")
                        req.flash('danger', 'The credentials you enterred is incorrect');
                        res.redirect('/login');
                    }
                });
            }
        }).catch((err) => {
            console.log(err.message);
        });
    }
}

//Get Logout
exports.getLogout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
}

exports.getUpload = (req, res) => {
    //checking if user is logged in
    if(req.session.user_id) {
        //create new page for upload
        res.render("home/upload", {
            "isLogin": true,
            message: '',
            title:  'Flixx | Upload'
        });
    } else {
        res.redirect("/login");
    }
}

//post getUpload
exports.postUpload = async (req, res) => {
    try {
        if(req.session.user_id) {
            const errors = validationResult(req)
            if(!errors.isEmpty()) {
                const alert = errors.array()
                res.render("home/upload", {
                    message: '',
                    alert,
                    title: 'Flixx | Upload'
                })
            } else {
                
                if(!req.files) {
                    req.flash('danger', 'Pls check the fields and upload a thumbnail and a video')
                    res.render("home/upload", {
                        message: '',
                        title: 'Flixx | Upload'
                    })
                } else {
                    let message = '';
                    let title = req.body.title;
                    let description = req.body.description;
                    let tags = req.body.tags;
                    let category = req.body.category;
                    let thumbnail = req.files.thumbnail;
                    let videoUpload = req.files.video;
                    if(!thumbnail) {
                        req.flash('danger', 'Pls check the fields and upload a thumbnail')
                        res.render("home/upload", {
                            message: '',
                            title: 'Flixx | Upload'
                        })
                    } else {            
        
                        if(!videoUpload) {
                            req.flash('danger', 'Pls check the fields and upload a video')
                            res.render("home/upload", {
                                message: '',
                                title: 'Flixx | Upload'
                            })
                        } else {
                            if(thumbnail.mimetype === 'image/png' || thumbnail.mimetype === 'image/jpg' || thumbnail.mimetype === 'image/jpeg' && videoUpload.mimetype === 'video/mp4') {
                                let fileName = Math.random().toString(10).slice(2) + '-' + new Date().getTime() + '-' + thumbnail.name;
                                let pathThumbnanil = 'public/thumbnails/' + fileName;
    
                                let pathMThumbnail = '/thumbnails/' + fileName;
    
                                thumbnail.mv(pathThumbnanil, function(err) {
                                    if(err) {
                                        return res.status(500).json({message : err.message});
                                    }   
                                })
    
                                let fileNameVideo = Math.random().toString(10).slice(2) + '-' + new Date().getTime() + '-' + videoUpload.name;
                                let pathVideo = 'public/videos/' + fileNameVideo;
    
                                let pathMVideo = '/videos/' + fileNameVideo;
    
                                videoUpload.mv(pathVideo, (err) => {
                                    if(err) {
                                        return res.status(500).json({message : err.message});
                                    } 
                                })

                                //get user data to save in videos document
                                getUser(req.session.user_id, (user) => {
                                    const currentTime = new Date().getTime();
                                    
                                    //get video duration
                                    getVideoDurationInSeconds(pathVideo).then((duration) => {
                                        let hours = Math.floor(duration / 60 / 60);
                                        let minutes = Math.floor(duration / 60) - (hours * 60);
                                        let seconds = Math.floor(duration % 60);
    
                                        //insert into database
                                        let video = new Video({
                                            user: {
                                                _id: user._id,
                                                name: user.name,
                                                image: user.image,
                                                subscribers: user.subscribers,
                                            },
                                            filePath: pathMVideo,
                                            thumbnail: pathMThumbnail,
                                            title: title,
                                            description: description,
                                            tags: tags,
                                            category: category,
                                            minutes: minutes,
                                            seconds: seconds,
                                            hours: hours,
                                            watch: currentTime,
                                            Views: 0,
                                            playlist: "",
                                            likes: [],
                                            dislikes: [],
                                            comments: []
                                        })
                                        video.save().then((data) => {                                           
                                            //insert in users collection(model) too
                                            User.findOneAndUpdate({
                                                _id: new ObjectId(req.session.user_id)
                                            }, {
                                                $push: {
                                                    videos: {
                                                        _id: data._id,
                                                        title: title,
                                                        views: 0,
                                                        thumbnail: pathMThumbnail,
                                                        category: category,
                                                        watch: currentTime
                                                    }
                                                }
                                            }).exec();
                                            req.flash('success', 'Your video has been uploaded successfully.')
                                            res.redirect("/");
                                            
                                        }).catch((err) => {
                                            console.log(err.message)
                                        })
                                    })
                                })
                            } else {
                                message = "Invalid File format. Only 'jpg', 'jpeg' and 'png' images and 'mp4' videos are allowed.";
                                res.render('home/upload', {
                                    "isLogin": true,
                                    message,
                                    title: 'Flixx | Upload'
                                })
                            }
                        }
                    }
                }
            }
        } else {
            res.redirect("/login")
        }
    } catch (error) {
        console.log(error.message)
    }
}

//watch videos
exports.getWatch = async (req, res) => {
    await Video.findOne({"watch": parseInt(req.params.watch)})
    .then((video) => {
        if(video == null){
            res.send("Video does not exists");
        } else {

            //increment views counter
            Video.findByIdAndUpdate({_id: video._id}, {
                $inc: {views: 1}}, {new: true}
            )
            .then((response) => {
                console.log('');
            }).catch((err) => {
                console.log(err.message);
            })
            getUser(req.session.user_id, (user) => {
                res.render("video-page/index", {
                    isLogin: req.session.user_id ? true : false,
                    video: video,
                    title: 'Flixx' +  ' | ' + video.title,
                    user: user,
                    //playlist watch
                    playlist: [],
                    playlistId: ""
                })
            })
        }
    }).catch((err) => {
        console.log(err.message)
    })
}

//do-like
exports.postLike = async (req, res) => {
    if(req.session.user_id) {
        //check if already liked
        Video.findOne({
            "_id": new ObjectId(req.body.videoId),
            "likes._id": req.session.user_id
        }).then((video) => {
            if(video == null){
                //push in likes array
                Video.updateOne({
                    "_id": new ObjectId(req.body.videoId)
                }, {
                    $push: {
                        likes: {
                            _id: req.session.user_id
                        }
                    }
                }).then((data) => {
                    res.json({
                        status: "success",
                        message: "Video has been liked"
                    });
                })
            } else {
                Video.updateOne({
                    "_id": new ObjectId(req.body.videoId)
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
                        message: "Video Unliked."
                    });
                }).catch((err) => {
                    console.log(err.message)
                })
            }
        })
    } else {
        res.json({
            status: "error",
            message: "Please login to like this post"
        });
    }
}

//comments
exports.postComment = async (req, res) => {
    try {
        if(req.session.user_id) {
            getUser(req.session.user_id, (user) => {
                Video.findOneAndUpdate({
                    "_id": new ObjectId(req.body.videoId)
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
                            createdAt: new Date().toLocaleDateString('en-US'),
                            time: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true}),
                            replies: [],
                        }
                    }
                }).then((err, data) => {
                    res.json({
                        // status: "success",
                        // message: "Comment has been posted",
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
    } catch (error) {
        
    }
    
}

//get-User
exports.getUser = async (req, res) => {
    if(req.session.user_id){
        getUser(req.session.user_id, function(user) {
            delete user.password
            res.json({
                status: "success",
                message: "Record has been fetched",
                user: user
            })         
        });
    } else {
        res.json({
            status: "error",
            message: "Please login to perform this action."
        });
    }
}

//do-reply : replying to comment
exports.doReply = async (req, res) => {
    if(req.session.user_id) {
        let reply = req.body.reply;
        let commentId = req.body.commentId;

        getUser(req.session.user_id, (user) => {
            Video.findOneAndUpdate({
                "comments._id": new ObjectId(commentId)
            }, {
                $push: {
                    "comments.$.replies": {
                        _id: new ObjectId(),
                        user: {
                            _id:user._id,
                            name: user.name,
                            image: user.image
                        },
                        reply: reply,
                        createdAt: new Date().toLocaleDateString('en-US'),
                        time: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true}),
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
            message: "Please Login to perform this action."
        })
    }
}

//subscribe
exports.subscribers = async (req, res) => {
    if(req.session.user_id){
        Video.findOne({
            "_id": new ObjectId(req.body.videoId),
        })
        .then((video) => {
            if(req.session.user_id == video.user._id) {
                res.json({
                    status: "error",
                    message: "You cannot subscribe on your own channel"
                });
            } else {
                //check if channel is already subscribes
                getUser(req.session.user_id, (myData) => {
                    let flag = false;
                    for(let a = 0; a < myData.subscriptions.length; a++){
                        if(myData.subscriptions[a]._id.toString() == video.user._id.toString()){
                            flag = true;
                            break;
                        }
                    }
                    if(flag) {
                        res.json({
                            status:"error",
                            message: "Already subscribed" 
                        });
                    } else {
                        User.findByIdAndUpdate({
                            "_id": video.user._id
                        }, {
                            $inc: {
                                "subscribers": 1
                            }
                        }, {
                            returnOriginal: false
                        }).then((userData) => {
                            User.updateOne({
                                "_id": new ObjectId(req.session.user_id)
                            }, {
                                $push: {
                                    "subscriptions": {
                                        "_id": video.user._id,
                                        "name": video.user.name,
                                        "subscribers": userData.subscribers,
                                        "image": userData.image,
                                    }
                                }
                            }).then((data) => {
                                Video.findOneAndUpdate({"_id": new ObjectId(req.body.videoId)}, {
                                    $inc: {"user.subscribers": 1}}, {new: true})
                                .then((response) => {
                                    res.status(200).send()
                                }).catch((err) => {
                                    console.log(err.message)
                                })
                            }).catch((err) => {
                                console.log(err.message)
                            })
                        }).catch((err) => {
                            console.log(err.message)
                        })
                    }
                })
            }
            // console.log(video.user._id);
        }).catch((err) => {
            console.log(err.message);
        })
    } else {
        res.json({
            status: "error",
            message: "Please login to perform this action."
        });
    }
}

//Related Video
exports.getRelatedVideo = async (req, res) => {
    if(req.session.user_id) {
        Video.find({
            $and: [{
                "category": req.params.category
            }, {
                "_id": {
                    $ne: new ObjectId(req.params.videoId)
                }
            }]
        })
        .then((videos) => {
            //shuffle the video
            for(let b = 0; b < videos.length; b++) {
                let x = videos[b];
                let y = Math.floor(Math.random() * (b + 1));
                videos[b] = videos[y];
                videos[y] = x;
            }
               
            res.json(videos) 
        }).catch((err) => {
            console.log(err.message)
        })
    } else {
        Video.find({
            $and: [{
                "category": req.params.category 
            }, {
                "_id": {
                    $ne: new ObjectId(req.params.videoId)
                }
            }]
        })
        .then((videos) => {
            //shuffle the video
            for(let a = 0; a < videos.length; a++) {
                let x = videos[a];
                let y = Math.floor(Math.random() * (a + 1));
                videos[a] = videos[y];
                videos[y] = x;
            }

            res.json(videos) 
        }).catch((err) => {
            console.log(err.messsage)
        })
    }
}

//Save History
exports.saveHistory = async (req, res) => {
    if(req.session.user_id) {
        Video.findOne({
            "_id": new ObjectId(req.body.videoId)
        })
        .then((video) => {
            User.findOne({
                $and: [{
                    "_id": new ObjectId(req.session.user_id)
                }, {
                    "history.videoId": req.body.videoId
                }]
            })
            .then((history) => {
                //Only push in array if not exists
                if(history == null) {
                    User.findOneAndUpdate({
                        "_id": new ObjectId(req.session.user_id)
                    }, {
                        $push: {
                            history: {
                                "_id": new ObjectId(),
                                videoId: req.body.videoId,
                                watch: video.watch,
                                title: video.title,
                                watched: req.body.watched,
                                thumbnail: video.thumbnail,
                                minutes: video.minutes,
                                seconds: video.seconds
                            }
                        }
                    }).exec();
                    res.json({
                        status: "success",
                        message: "History has been added"
                    })
                } else {
                    User.findOneAndUpdate({
                        $and: [{
                            "_id": new ObjectId(req.session.user_id)
                        }, {
                            "history.videoId": req.body.videoId
                        }]
                    }, {
                        $set: {
                            "history.$.watched": req.body.watched
                        }}, {new: true}
                    ).then((response) => {
                        res.status(200).send()
                    }).catch((err) => {
                        console.log(err.message)
                    }) 
                    res.json({
                        status: "success",
                        message: "History has been updated"
                    })
                }
            })
        })
    } else {
        res.json({
            status: "error",
            message: "Please login to perform this action."
        })
    }
}

//Watch History
exports.watchHistory = async (req, res) => {
    if(req.session.user_id) {
        getUser(req.session.user_id, function(user) {
            res.render("home/watch-history", {
                isLogin: true,
                user: user,
                videos: user.history,
                title: 'Flixx | History'
            });
        })
    } else {
        res.redirect("/login");
    }
}

//delete from history : watch history
exports.deleteHistory = async (req, res) => {
    if(req.session.user_id) {
        User.updateOne({
            $and: [{
                "_id": new ObjectId(req.session.user_id)
            }, {
                "history.videoId": req.body.videoId
            }]
        }, {
            $pull: {
                history: {
                    "videoId": req.body.videoId
                }
            }
        }).exec();

        req.flash('success', 'Video has been deleted from your history')
        res.redirect('/watch-history');
    } else {
        res.redirect("/login");
    }
}

//channel
exports.getChannel = async (req, res) => {
    User.findById({_id: req.params._id})
    .then((user) => {
        if(user == null) {
            res.send("Channel not found")
        } else {
            res.render("home/single-channel", {
                isLogin: req.session.user_id ? true : false,
                user: user,
                isMyChannel: req.session.user_id == req.params._id,
                title : 'Flixx | My Channel Page'
            })
        }
    }).catch((err) => {
        console.log(err.message)
    })
}

//changing profile picture
exports.postProfilePicture =  (req, res) => {
    if(req.session.user_id) {
        if(!req.files)
            res.send('No file selected');

            let profilePicture = req.files.image;
            let profileImage = req.body.profileImage;

            let profilePicturePath = 'public/profiles/' + req.session.user_id + "-" + profilePicture.name;
            let profilePicturePath2 = 'profiles/' + req.session.user_id + "-" + profilePicture.name;

            if(profileImage != "") {
                fs.unlink('public/' + profileImage, (err) => {
                    if(err)
                        console.log(err);
                });
            }

            if(profilePicture.mimetype === 'image/png' || profilePicture.mimetype === 'image/jpg' || profilePicture.mimetype === 'image/jpeg'){
                profilePicture.mv(profilePicturePath, function(err) {
                    if(err) {
                        res.send(err)
                    } else {
                        User.updateOne({"_id": new ObjectId(req.session.user_id)}, {
                            $set: {image:profilePicturePath2}}, {new: true}
                        )
                        .then((response) => {
                            res.status(200).send()
                        }).catch((err) => {
                            console.log(err.message)
                        })
                        User.updateOne({
                            "subscriptions._id": new ObjectId(req.session.user_id)
                        }, {
                            $set: {
                                "subscriptions.$.image": profilePicturePath2 
                            }}, {new: true}
                        ).then((response) => {
                            res.status(200).send()
                        }).catch((err) => {
                            console.log(err.message)
                        })
                        Video.updateOne({
                            "user._id": new ObjectId(req.session.user_id)
                        }, {
                            $set: {
                                "user.image": profilePicturePath2 
                            }}, {new: true}
                        ).then((response) => {
                            res.status(200).send()
                        }).catch((err) => {
                            console.log(err.message)
                        })
                        res.redirect("/channel/" + req.session.user_id);
                    }
                })
            } else {
                res.send("Invalid File format. Only 'jpg', 'jpeg' and 'png' images are allowed.")
            }
    } else {
        res.redirect("/login")
    }
}

//changing-cover-picture
exports.postCoverPicture = (req, res) => {
    if(req.session.user_id) {
        if(!req.files)
            res.send('No file was selected');

            let coverPicture = req.files.coverimage;
            let CoverImage = req.body.CoverImage;

            let coverPicturePath = 'public/covers/' + req.session.user_id + "-" + coverPicture.name
            let coverPicturePath2 = 'covers/' + req.session.user_id + "-" + coverPicture.name
            
            if(CoverImage != "") {
                fs.unlink('public/' + CoverImage, (err) => {
                    if(err)
                        console.log(err);
                });
            }
            if(coverPicture.mimetype === 'image/png' || coverPicture.mimetype === 'image/jpg' || coverPicture.mimetype === 'image/jpeg'){
                coverPicture.mv(coverPicturePath, (err) => {
                    if(err){
                        console.log(err)
                    } else {
                        User.updateOne({
                            "_id": new ObjectId(req.session.user_id)
                        }, {
                            $set: {
                                coverPhoto: coverPicturePath2
                            }}, {new: true}
                        )
                        .then((response) => {
                            res.status(200).send()
                        }).catch((err) => {
                            console.log(err.message);
                        })
                        res.redirect("/channel/" + req.session.user_id);
                    }
                })
            } else {
                res.send("Invalid File format. Only 'jpg', 'jpeg' and 'png' images are allowed.")
            }
    } else {
        res.redirect("/login")
    }
}

//Edit Video
exports.editVideo = (req, res) => {
    if(req.session.user_id) {
        Video.findOne({
            $and: [{
                "watch": parseInt(req.params.watch)
            }, {
                "user._id": new ObjectId(req.session.user_id)}]
        })
        .then((video) => {
            if(video == null) {
                res.send("Sorry you do not own this video.");
            } else {
                getUser(req.session.user_id, function(user) {
                    res.render("home/edit-video", {
                        isLogin: true,
                        video: video,
                        user: user,
                        title: 'Flixx | Edit',
                        message: ''

                    });
                }); 
            }
        }).catch((err) => {
            console.log(err.message)
        })
    } else {
        res.redirect("/login")
    }
}

//Post Edited video
exports.postEditVideo = (req, res) => {
    if(req.session.user_id) {
        Video.findOne({
            $and: [{
                "user._id": new ObjectId(req.session.user_id) 
            }, {
                "_id": new ObjectId(req.body.videoId)
            }]
        })
        .then((mainVideo) => {
            if(mainVideo == null){
                res.send('danger', 'Sorry you do not own this video.')
            } else {
                if(req.files == null) {
                    req.files = mainVideo.thumbnail;
                    Video.findOneAndUpdate({
                        "_id":  new ObjectId(req.body.videoId)
                    }, {
                        $set: {
                            title: req.body.title,
                            description: req.body.description,  
                            tags: req.body.tags,
                            category: req.body.category,
                            thumbnail: mainVideo.thumbnail,
                            playlist: req.body.playlist
                        }
                    }).then((data) => {
                        if(req.body.playlist == "") {
                            User.findOneAndUpdate({
                                $and: [{
                                    "_id": new ObjectId(req.session.user_id)
                                }, {
                                    "videos._id": new ObjectId(req.body.videoId) //data._id //_id.videoId  //ObjectId(req.params.videoId)
                                }]  
                            }, {
                                $set: {
                                    "videos.$.title": req.body.title,
                                    "videos.$.thumbnail": mainVideo.thumbnail,
                                    "videos.$.category": req.body.category
                                }}, {new: true}
                            ).then((response) => {
                                res.status(200).send()
                            }).catch((err) => {
                                console.log(err.message)
                            })
                            //playlist
                            User.updateOne({
                                $and: [{
                                    "_id": new ObjectId(req.session.user_id)
                                }, {
                                    "playlists._id": new ObjectId(mainVideo.playlist)
                                }]
                            }, {
                                $pull: {
                                    "playlists.$.videos": {
                                        "_id": req.body.videoId
                                    }
                                } 
                            })
                        } else {
                            if(mainVideo.playlist != "") {
                                User.updateOne({
                                    $and: [{
                                        "_id": new ObjectId(req.session.user_id)
                                    }, {
                                        "playlists._id": new ObjectId(mainVideo.playlist)
                                    }]
                                }, {
                                    $pull: {
                                        "playlists.$.videos": {
                                            "_id": req.body.videoId
                                        }
                                    }
                                }).exec()
                            }

                            User.updateOne({
                                $and: [{
                                    "_id": new ObjectId(req.session.user_id)
                                }, {
                                    "playlists._id": new ObjectId(req.body.playlist)
                                }]
                            }, {
                                $push: {
                                    "playlists.$.videos": {
                                        "_id": req.body.videoId,
                                        "title": req.body.title,
                                        "watch": mainVideo.watch,
                                        "thumbnail": mainVideo.thumbnail
                                    }
                                }
                            }).exec()
                        }
                       
                    }).catch((err) => {
                        console.log(err.message)
                    })
                    req.flash('success', 'Video edited successfully')
                    res.redirect("/edit/" + mainVideo.watch);

                } else {
                    let newThumbnail = req.files.thumbnail;

                    if(newThumbnail.mimetype === 'image/png' || newThumbnail.mimetype === 'image/jpg' || newThumbnail.mimetype === 'image/jpeg'){
                        let fileNameT = Math.random().toString(10).slice(2) + '-' + new Date().getTime() + '-' + newThumbnail.name;
                        let newThumbnailPath = 'public/thumbnails/' + fileNameT;
                        let newThumbnailPath2 = '/thumbnails/' + fileNameT; 
                        newThumbnail.mv(newThumbnailPath, function(err) {
                            if(err)
                                console.log(err);
                        })

                        fs.unlink('public/' + mainVideo.thumbnail, (err) => {
                            if(err)
                                console.log(err);
                        });

                        Video.findOneAndUpdate({
                            "_id": new ObjectId(req.body.videoId)
                        }, {
                            $set: {
                                title: req.body.title,
                                description: req.body.description,  
                                tags: req.body.tags,
                                category: req.body.category,
                                thumbnail: newThumbnailPath2,
                                playlist: req.body.playlist
                            }
                        })
                        .then((data) => {
                            if(req.body.playlist == "") {
                                User.findOneAndUpdate({
                                    $and: [{
                                        "_id": new ObjectId(req.session.user_id)
                                    }, {
                                        "videos._id": new ObjectId(req.body.videoId) //data._id //_id.videoId  //ObjectId(req.params.videoId)
                                    }] 
                                }, {
                                    $set: {
                                        "videos.$.title": req.body.title,
                                        "videos.$.thumbnail": newThumbnailPath2,
                                        "videos.$.category": req.body.category
                                    }}, {new: true}
                                ).then((response) => {
                                    res.status(200).send()
                                }).catch((err) => {
                                    console.log(err.message)
                                })

                                //playlist
                                User.updateOne({
                                    $and: [{
                                        "_id": new ObjectId(req.session.user_id)
                                    }, {
                                        "playlists._id": new ObjectId(mainVideo.playlist)
                                    }]
                                }, {
                                    $pull: {
                                        "playlists.$.videos": {
                                            "_id": req.body.videoId
                                        }
                                    }  
                                })
                            } else {
                                if(mainVideo.playlist != "") {
                                    User.updateOne({
                                        $and: [{
                                            "_id": new ObjectId(req.session.user_id)
                                        }, {
                                            "playlists._id": new ObjectId(mainVideo.playlist)
                                        }]
                                    }, {
                                        $pull: {
                                            "playlists.$.videos": {
                                                "_id": req.body.videoId
                                            }
                                        }
                                    }).exec()
                                }

                                User.updateOne({
                                    $and: [{
                                        "_id": ObjectId(req.session.user_id)
                                    }, {
                                        "playlists._id": ObjectId(req.body.playlist)
                                    }]
                                }, {
                                    $push: {
                                        "playlists.$.videos": {
                                            "_id": req.body.videoId,
                                            "title": req.body.title,
                                            "watch": mainVideo.watch,
                                            "thumbnail": mainVideo.thumbnail
                                        }
                                    }
                                }).exec()
                            }
                            
                        }).catch((err) => {
                            console.log(err.message)
                        });  
                        req.flash('success', 'Video edited successfully.')
                        res.redirect("/edit/" + mainVideo.watch); 
                        
                    } else {
                        let message = "Invalid File format. Only 'jpg', 'jpeg' and 'png' images are allowed.";
                        res.render("home/edit-video", {
                            isLogin: true,
                            video: req.body.videoId,
                            // user: user,
                            title: 'Flixx | Edit',
                            message,
                        });   
                    }
                }
                
            }
        }).catch((err) => {
            console.log(err.message);
        })
    } else {
        res.redirect("/login")
    }
}

//Delete video
exports.deleteVideo = (req, res) => {
    if(req.session.user_id) {
        Video.findOne({
            $and: [{
                "_id": new ObjectId(req.body._id)
            }, {
                "user._id": new ObjectId(req.session.user_id)
            }]
        })
        .then((video) => {
            if(video == null) {
                res.send("Sorry, you do not own this video.");
                return;
            }
            fs.unlink('public' + video.filePath, function(error) {
                fs.unlink('public' + video.thumbnail, function(error){
                    if(error) {
                        console.log(error)
                    }
                    //
                });
            });
            Video.deleteOne({
                $and: [{
                    "_id": new ObjectId(req.body._id)
                }, {
                    "user._id": new ObjectId(req.session.user_id)
                }]
            }).exec();
            User.findOneAndUpdate({
                "_id": new ObjectId(req.session.user_id)
            }, {
                $pull: {
                    videos: {
                        "_id": new ObjectId(req.body._id)
                    }
                }
            }).exec();
            User.updateMany({}, {
                $pull: {
                    history: {
                        "videoId": req.body._id.toString()
                    }
                }
            }).exec();

            req.flash('success', 'Video deleted successfully')
            res.redirect("/channel/" + req.session.user_id);
        })
    } else {
        res.redirect("/login")
    }
}

//create/post playlist
exports.postPlaylist = (req, res) => {
    if(req.session.user_id) {
        User.updateOne({
            "_id": new ObjectId(req.session.user_id)
        }, {
            $push: {
                "playlists": {
                    _id: new ObjectId(),
                    title: req.body.title,
                    videos: []
                }
            }
        }).exec()
        req.flash('success', 'Playlist created successfully')
        res.redirect("/channel/" + req.session.user_id)
    } else {
        res.redirect("/login")
    }
}

//view playlist
exports.getPlaylist = (req, res) => {
    Video.findOne({
        $and: [{
            "watch": parseInt(req.params.watch)
        }, {
            "playlist": req.params._id
        }]
    })
    .then((video) => {
        if(video == null) {
            res.send("Video does not exists.");
        } else {
            Video.updateOne({
                "_id": new ObjectId(video._id)
            }, {
                $inc: {
                    "views": 1
                }}, {new: true}
            ).then((response) => {
                res.status(200).send()
            }).catch((err) => {
                console.log(err.message)
            })
            getUser(video.user._id, function(user) {
                let playlistVideos = [];
                for(let a = 0; a < user.playlists.length; a++) {
                    if(user.playlists[a]._id == req.params._id) {
                        playlistVideos = user.playlists[a].videos;
                        break;
                    }
                }
                res.render("video-page/index", {
                    isLogin: req.session.user_id ? true : false,
                    video: video,
                    title: video.title,
                    user: user,
                    playlist: playlistVideos,
                    playlistId: req.params._id
                });
            });
        }
    }).catch((err) => {
        console.log(err.message)
    })
}

//delete playlist
exports.deletePlaylist = (req, res) => {
    if(req.session.user_id){
        User.findOne({
            $and: [{
                "_id": new ObjectId(req.session.user_id)
            }, {
                "playlists._id": new ObjectId(req.body._id) 
            }]
        })
        .then((data) => {
            if(data == null) {
                res.send("Sorry, You do not own this playlist.")
                return;
            }
            User.updateOne({
                "_id": new ObjectId(req.session.user_id)
            }, {
                $pull: {
                    "playlists": {
                        "_id": new ObjectId(req.body._id)
                    }
                }
            }).exec();
            Video.updateMany({
                "playlist": req.body._id
            }, {
                $set: {
                    "playlist": ""
                }
            });
        }).catch((err) => {
            console.log(err.message)
        })
        req.flash('success', 'Playlist deleted successfully.')
        res.redirect("/channel/" + req.session.user_id);
    } else {
        res.redirect("/login")
    }
}

//Subscription
exports.getSubscription = (req, res) => {
    if(req.session.user_id) {
        getUser(req.session.user_id, function(user) {
            res.render('home/subscriptions', {
                isLogin: true,
                user: user,
                title: 'Flixx | subscribed channel'
            })
        })
    } else {
        res.redirect("/login")
    }
}

//Remove-channel-from-subscription-page
exports.removeSubscription = (req, res) => {
    if(req.session.user_id) {
        User.updateOne({
            "_id": new ObjectId(req.session.user_id)
        }, {
            $pull: {
                "subscriptions": {
                    "_id": req.body._id
                }
            }
        })
        .then((data) => {
            if(data.modifiedCount > 0) {
                User.updateOne({
                    "_id": new ObjectId(req.body._id)
                }, {
                    $inc: {
                        "subscribers": -1
                    }}, {new: true}
                ).then((response) => {
                    res.status(200).send()
                })
                Video.updateOne({"user._id": new ObjectId(req.body._id)
                }, {
                    $inc: {
                        "user.subscribers": -1
                    }}, {new: true}
                ).then((response) => {
                    res.status(200).send()
                })
            }
            req.flash('success', 'Deleted successfully.')
            res.redirect("/my_subscriptions")
        }).catch((err) => {
            console.log(err.message)
        })
    } else {
        res.redirect("/login")
    }
}

//category search
exports.categorySearch = (req, res) => {
    Video.find({"category": {"$regex": req.params.query}})
    .then((videos) => {
        res.render('home/search', {
            isLogin: req.session.user_id ? true : false,
            videos: videos,
            query: req.params.query,
            title: 'Flixx' + ' ' +  '|' + ' ' + req.params.query
        })
    })
}

//Tags: search
exports.getTags = (req, res) => {
    Video.find({"tags": {"$regex": req.params.query, "$options": "i"}})
    .then((videos) => {
        res.render('home/search', {
            isLogin: req.session.user_id ? true : false,
            videos: videos,
            query: req.params.query,
            title: 'Flixx' + ' ' +  '|' + ' ' + req.params.query
        })
    })
}

//search
exports.search = (req, res) => {
    Video.find({"title": {"$regex": req.query.search_query, "$options": "i"}})
    .then((videos) => {
        if(videos == "") {
            res.render('home/search404', {
                title: 'Flixx' + ' ' +  '|' + ' ' + req.query.search_query
            })
        } else {
            res.render('home/search', {
                isLogin: req.session.user_id ? true : false,
                videos: videos,
                query: req.query.search_query,
                title: 'Flixx' + ' ' +  '|' + ' ' + req.query.search_query
            })
        }
    })
}

//Settings
exports.settings = (req, res) => {
    if(req.session.user_id) {
        getUser(req.session.user_id, (user) => {
            res.render("home/settings", {
                isLogin: true,
                user: user,
                req: req.query,
                title: 'Flixx | Settings' 
            });
        })
    } else {
        res.redirect("/login")
    }
}

//post settings
exports.postSettings = (req, res) => {
    if(req.session.user_id) {
        if(req.body.password == "") {
            User.updateOne({
                "_id": new ObjectId(req.session.user_id)
            }, {
                $set: {
                    "name": req.body.name,
                }}, {new: true}
            ).then((response) => {
                res.status(200).send()
            }).catch((err) => {
                console.log(err.message)
            })
        } else {
            bcrypt.hash(req.body.password, 10, function(error, hash) {
                User.updateOne({
                    "_id": new ObjectId(req.session.user_id)
                }, {
                    $set: {
                        "name": req.body.name,
                        "password": hash
                    }}, {new: true}
                ).then((response) => {
                    res.status(200).send()
                }).catch((err) => {
                    console.log(err.message)
                })
            })
        }
        User.updateMany({
            "subscriptions._id": new ObjectId(req.session.user_id)
        }, {
            $set: {
                "subscriptions.$.name": req.body.name
            }}, {new: true}
        ).then((response) => {
            res.status(200).send()
        }).catch((err) => {
            console.log(err.message)
        })
        Video.updateMany({
            "user._id": new ObjectId(req.session.user_id)
        }, {
            $set: {
                "user.name": req.body.name,
            }}, {new: true}
        ).then((response) => {
            res.status(200).send()
        }).catch((err) => {
            console.log(err.message)
        })
        req.flash('success', 'Changed successfully');
        res.redirect("/settings"); 
    } else {
        res.redirect("/login")
    }
}