var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var path = require('path');
var http = require('http');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;


var server = http.createServer(app);
server.listen(8080,function(){
    console.log("Server listening on port: 8080");
});

let db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
});

app.use(bodyParser.urlencoded({extended: false}));
/*app.use(express.static(path.join(__dirname,'../'))); */


app.get('/', function(req,res){
    res.sendFile(path.join(__dirname,'../index.html'));
});

// add extra fields here as type TEXT
db.run('CREATE TABLE IF NOT EXISTS emp(id TEXT, name TEXT)');

/* these following functions will require editing to accept more or different field values */

// View
app.post('/view', function(req,res){
    db.serialize(()=>{
        db.each('SELECT id ID, name NAME FROM emp WHERE id =?', [req.body.id], function(err,row){

            if(err){
                res.send("Error encountered while displaying");
                return console.error(err.message);
            }
            res.send(` ID: ${row.ID},    Name: ${row.NAME}`);
            console.log("Entry displayed successfully");
        });
    });
});


// Insert
app.post('/add', function(req,res){
    db.serialize(()=>{
        db.run('INSERT INTO emp(id,name) VALUES(?,?)', [req.body.id, req.body.name], function(err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("New employee has been added");
            res.send("New employee has been added into the database with ID = "+req.body.id+ " and Name = "+req.body.name);
        });
    });
});

//UPDATE
app.post('/update', function(req,res){
    db.serialize(()=>{
        db.run('UPDATE emp SET name = ? WHERE id = ?', [req.body.name,req.body.id], function(err){
            if(err){
                res.send("Error encountered while updating");
                return console.error(err.message);
            }
            res.send("Entry updated successfully");
            console.log("Entry updated successfully");
        });
    });
});


//DELETE
app.post('/delete', function(req,res){
    db.serialize(()=>{
        db.run('DELETE FROM emp WHERE id = ?', req.body.id, function(err) {
            if (err) {
                res.send("Error encountered while deleting");
                return console.error(err.message);
            }
            res.send("Entry deleted");
            console.log("Entry deleted");
        });
    });
});



app.get('/close', function(req,res){
    db.close((err) => {
        if (err) {
            res.send('There is some error in closing the database');
            return console.error(err.message);
        }
        console.log('Closing the database connection.');
        res.send('Database connection successfully closed');
    });
});