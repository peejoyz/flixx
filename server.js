if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const expressSession = require('express-session');
const MongoStore = require('connect-mongo');
const fileUpload = require('express-fileupload');

const app = express();

const port = process.env.port || 7000;
mongoose.set('strictQuery', false);
const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
}

//express-fileupload
app.use(fileUpload());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set("view engine", "ejs")
//public folder
app.use(express.static(path.join(__dirname, 'public')));
//set global errors variable
app.locals.errors = null;
const home = require('./routes/home');
const blog = require('./routes/blogRoutes');
const blogIndex = require('./routes/blogIndexRoute')
app.set('trust proxy', 1)
app.use(expressSession({
    key: process.env.KEY,
    secret: process.env.SECRET,
    resave: process.env.resave,
    saveUninitialized: process.env.saveUninitialized,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: process.env.touchAfter
    }),
    cookie: {
        // secure: process.env.secure,
        expires: 360000
    }
}));
// Express Messages middleware : NB: you need to install connect-flash too
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages') (req, res);
    next();
});
app.use(home);
app.use('/blog/posts', blog);
app.use(blogIndex);
// displaying 404 page if the route does not exist.
app.use((req, res) => {
    res.status(404).render('404.ejs', {
        title: 'Page not Found'
    });
});
//Connect to the database before listening
connectDB().then(() => {
    app.listen(port, () => {
        console.log("listening for requests");
    })
})
