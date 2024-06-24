const mongoose = require('mongoose');

const connect_to_database = (url) => 
{
    mongoose.connect(url)
    .then(() => {console.log("MongoDB Connected!");})
    .catch((err) => {console.log(err);})
}

module.exports = connect_to_database;