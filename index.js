// Importing Modules
const express = require('express');
const dotenv = require('dotenv').config();
const connect_to_database = require("./services/db_connnection");
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const uuid = require('uuid')

// Variables
var sessionIdToCookieMap = new Map();

//Defining App
const app = express()

// Setting Engine
app.set('view engine', 'ejs');

//Models

const todoSchema = mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    createdBy: { type: String, required: true }
});

const Todo = mongoose.model('todos', todoSchema);

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('users', userSchema);

// Functions

function handle_add_users(username, email, password) {
    User.create({ username: username, email: email, password: password });
}

function setUser(id, user) {
    sessionIdToCookieMap.set(id, user)
}

function getUser(id) {
    var user = sessionIdToCookieMap.get(id);
    return user;
}

async function handle_check_users(req, res) {
    var { email, password } = req.body;
    const user = await User.findOne({ email, password })

    if (user) {
        const sessionId = uuid.v4();
        setUser(sessionId, user);
        res.cookie('uid', sessionId);
        return res.redirect('/');
    }

    if (!user) return res.render('login', data = { msg: "Incorrect E-mail or Password!" })
}

//Middlewares
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Databse Connection
connect_to_database(process.env.DB_URL);

// Routes
app.get("/", async (req, res, next) => {
    const userUid = req.cookies.uid;
    var user = getUser(userUid);

    if (user) {
        const todo = await Todo.find({ 'createdBy': user.username });
        res.render('index', data = { usr: user, todo: todo })
    }

    if (!user) { res.render('login', data = { msg: "" }) }
})

app.get("/login", (req, res) => { res.render("login", data = { msg: "" }); })
app.get("/register", (req, res) => { res.render("register"); })

app.post('/add-usr', (req, res) => {
    var { username, email, password } = req.body
    handle_add_users(username, email, password)
    res.redirect('/login')
})

app.post('/check-usr', handle_check_users);

app.get('/logout', (req, res) => {
    res.clearCookie('uid');
    res.redirect('/login');
});

app.post('/add-todo', (req, res) => {
    const userUid = req.cookies.uid;

    var user = getUser(userUid)

    const todo_id = uuid.v4();
    Todo.create({ id: todo_id, title: req.body.todoTitle, createdBy: user.username })
    res.redirect('/')
});

app.post('/delete-todo/:id', async (req, res) => {
    await Todo.deleteOne({ 'id': req.params.id });
    res.redirect('/');
});

// Port
app.listen(process.env.PORT, () => { console.log("Server Is Running On 'http://localhost:" + process.env.PORT + "'"); });
