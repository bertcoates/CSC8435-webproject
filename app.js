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
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;


var server = http.createServer(app);
server.listen(8080, function () {
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


app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// add extra fields here as type TEXT
db.serialize(() => {
    db.run('PRAGMA foreign_keys=on');
    db.run('CREATE TABLE IF NOT EXISTS leagues(league_id INTEGER NOT NULL, league_name TEXT,secretary_name TEXT, secretary_email TEXT, public_private TEXT, PRIMARY KEY (league_id))');
    db.run('CREATE TABLE IF NOT EXISTS clubs(club_id INTEGER NOT NULL, club_name TEXT, league_id INTEGER, league_name TEXT, club_email TEXT, PRIMARY KEY (club_id), FOREIGN KEY (league_id) REFERENCES leagues(league_id))');
    db.run('CREATE TABLE IF NOT EXISTS runners(runner_id INTEGER NOT NULL, runner_forename TEXT, runner_surname TEXT, gender TEXT, runner_dob TEXT, runner_email TEXT, club_id INTEGER, runner_photo BLOB, PRIMARY KEY (runner_id), FOREIGN KEY (club_id) REFERENCES clubs(club_id))');
    db.run('CREATE TABLE IF NOT EXISTS run_times(run_time_id INTEGER NOT NULL, runner_id INTEGER, runner_name TEXT, club_id INTEGER, club_name TEXT, league_id INTEGER, league_name TEXT, run_date TEXT, run_time INTEGER, PRIMARY KEY (run_time_id), FOREIGN KEY (runner_id) REFERENCES runners(runner_id), FOREIGN KEY (club_id) REFERENCES clubs (club_id), FOREIGN KEY (league_id) REFERENCES leagues (league_id))');

    db.run('INSERT INTO leagues(league_name, secretary_name, secretary_email) VALUES("great north run","bert coates","bert.coates@greatrunners.com")');
    db.run('INSERT INTO clubs(club_name, league_name, club_email) VALUES("berts runners","great north run","bertsrunners@greatrunners.com")');
    db.run('INSERT INTO runners(runner_forename, runner_surname, runner_email, club_id) VALUES("bert","coates","bert.coates.runner@greatrunners.com",1)');
});

/* these following functions will require editing to accept more or different field values */

// Views
app.post('/viewleague', function (req, res) {
    db.serialize(() => {
        db.each('SELECT league_id, league_name, secretary_name, secretary_email, public_private FROM leagues WHERE league_id =? OR league_name =?', [req.body.league_id, req.body.league_name.toLowerCase()], function (err, row) {

            if (err) {
                res.send("Error encountered while displaying");
                return console.error(err.message);
            }
            res.send(` League ID: ${row.league_id}, Name: ${row.league_name}, Secretary: ${row.secretary_name}, Email: ${row.secretary_email}, Public or Private: ${row.public_private}`);
            console.log("Entry displayed successfully");
        });
    });
});

app.post('/viewrunner', function (req, res) {
    db.serialize(() => {
        db.each('SELECT r.runner_id, r.runner_forename, r.runner_surname, r.gender, r.runner_email, c.club_id, c.club_name FROM runners r JOIN clubs c ON r.club_id = c.club_id WHERE runner_id =? OR runner_forename =? OR runner_surname =?', [req.body.runner_id, req.body.runner_forename.toLowerCase(), req.body.runner_surname.toLowerCase()], function (err, row) {

            if (err) {
                res.send("Error encountered while displaying");
                return console.error(err.message);
            }
            /*res.send(`Runner ID: ${row.runner_id} <br><br>Name: ${row.runner_forename} ${row.runner_surname} <br>Email: ${row.runner_email} <br>Club ID: ${row.club_id} <br>Club Name: ${row.club_name}`);*/
            res.json(row);
            console.log("Entry displayed successfully");
        });
    });
});

app.post('/viewclub', function (req, res) {
    db.serialize(() => {
        db.each('SELECT c.club_id, c.club_name, c.secretary_name, c.secretary_email, l.league_id, l.league_name FROM clubs c JOIN leagues l ON c.league_id = l.league_id WHERE club_id =? OR club_name =?', [req.body.club_id, req.body.club_name.toLowerCase()], function (err, row) {

            if (err) {
                res.send("Error encountered while displaying");
                return console.error(err.message);
            }

            res.send(`Club ID: ${row.club_id} <br><br>Club Name: ${row.club_name} <br>Secretary Name: ${row.secretary_name} <br>Secretary Email: ${row.secretary_email} <br>League ID: ${row.league_id} <br>League Name: ${row.l.league_name}`);
            console.log("Entry displayed successfully");
        });
    });

});


// Inserts
app.post('/addleague', function (req, res) {
    db.serialize(() => {
        db.run('INSERT INTO leagues(league_name,secretary_name,secretary_email,public_private) VALUES(?,?,?,?)', [req.body.league_name.toLowerCase(), req.body.secretary_name.toLowerCase(), req.body.secretary_email, req.body.public_private], function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("New league has been added");
            res.send("New " + req.body.public_private + " league has been added into the database with League Name = " + req.body.league_name + ", Secretary Name = " + req.body.secretary_name + ", and Secretary Email = " + req.body.secretary_email);
        });
    });
});

app.post('/addrunner', function (req, res) {
    db.serialize(() => {
        db.run('INSERT INTO runners(gender,runner_forename,runner_surname,runner_dob,runner_email,club_name,runner_photo) VALUES(?,?,?,?,?,?,?)', [req.body.gender, req.body.runner_forename.toLowerCase(), req.body.runner_surname.toLowerCase(), req.body.runner_dob, req.body.runner_email, req.body.club_name, req.body.runner_photo], function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log("New runner has been added");
            res.send(`New runner has been added into the database with:<br><br> Gender = ${req.body.gender} <br>Name = ${req.body.runner_forename} ${req.body.runner_surname} <br>DoB = ${req.body.runner_dob} <br>Email = ${req.body.runner_email} <br>Club = ${req.body.club_name}`);
        });
    });
});

//UPDATE
app.post('/updaterunner', function (req, res) {
    db.serialize(() => {
        db.run('UPDATE runners SET gender =?, runner_forename = ?, runner_surname = ?, runner_email = ?, club_id = ? WHERE runner_id = ?', [req.body.new_gender, req.body.new_runner_forename, req.body.new_runner_surname, req.body.new_runner_email, req.body.new_club_id], function (err) {
            if (err) {
                res.send("Error encountered while updating");
                return console.error(err.message);
            }
            res.send("Entry updated successfully");
            console.log("Entry updated successfully");
        });
    });
});

app.post('/updateleague', function (req, res) {
    db.serialize(() => {
        db.run('UPDATE leagues SET league_name =?, secretary_name =?, secretary_email =? WHERE league_id = ?', [req.body.new_league_name, req.body.new_secretary_name, req.body.new_secretary_email], function (err) {
            if (err) {
                res.send("Error encountered while updating");
                return console.error(err.message);
            }
            res.send("Entry updated successfully");
            console.log("Entry updated successfully");
        });
    });
});


//DELETE
app.post('/deleterunner', function (req, res) {
    db.serialize(() => {
        db.run('DELETE FROM runners WHERE runner_id = ?', req.body.runner_id, function (err) {
            if (err) {
                res.send("Error encountered while deleting");
                return console.error(err.message);
            }
            res.send("Entry deleted");
            console.log("Entry deleted");
        });
    });
});


app.get('/close', function (req, res) {
    db.close((err) => {
        if (err) {
            res.send('There is some error in closing the database');
            return console.error(err.message);
        }
        console.log('Closing the database connection.');
        res.send('Database connection successfully closed');
    });
});