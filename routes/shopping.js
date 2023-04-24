var express = require('express');

var router = express.Router();


const fs = require('fs');


//var shopping = new Array(); 


session = require('express-session');

router.use(session({

    secret: 'random string',

    resave: true,

    saveUninitialized: true,

}));


sqlite3 = require('sqlite3');

db = new sqlite3.Database('shopping.sqlitedb');

db.serialize();

db.run(`CREATE TABLE IF NOT EXISTS shopping(

    id INTEGER PRIMARY KEY,

    user TEXT NOT NULL,

    task TEXT,

    brand TEXT,

    url TEXT,

    date_created TEXT,

    date_modified TEXT)`

);

db.parallelize();


fileUpload = require('express-fileupload');

router.use(fileUpload());


bcrypt = require('bcryptjs');

users = require('./passwd.json');


router.get('/login', function(req, res) {

        res.render('login', {info: 'Въведете име и парола'});

});


router.post('/login', function(req, res){

        bcrypt.compare(req.body.password, users[req.body.username] || "", function(err, is_match) {

                if(err) throw err;

                if(is_match === true) {

                        req.session.username = req.body.username;

                        req.session.count = 0;

                        res.redirect("/shopping/");

                } else {

                        res.render('login', {warn: 'Грешно име или парола'});

                }

        });

});


router.get('/logout', (req, res) => {

        req.session.destroy();

        res.redirect("/shopping/");

});


//let filename = "";


router.all('*', function(req, res, next) {

        if(!req.session.username) {

                res.redirect("/shopping/login");

                return;

        }

        next();

//        filename = req.session.username + ".txt";

//        fs.readFile(filename, (err, data) => {

//                if(err) shopping = new Array();

//                else {

//                        shopping = data.toString().split("\n").filter(s => s.length > 0);

//                }

//                next();

//        });

});


//CRUD

//cREADud

router.get('/', function(req, res, next) {

        req.session.count++;

        s = "Здравейте " + req.session.username 
        // + " Count: " + req.session.count + " " + new Date();

//        res.render('shopping', { info: s, shopping: shopping });

        db.all('SELECT * FROM shopping ORDER BY date_modified DESC;', function(err, rows) {

                if(err) throw err;

                res.render('shopping', { info: s, rows: rows, user:req.session.username });

        });

});


//router.post('/', function(req, res, next) {

//        q = req.body;

//        if(q.action=="add") shopping.push(q.shopping);

//        if(q.action=="del") shopping.splice(q.shopping, 1);

//        if(q.action=="add" || q.action=="del") {

//                let txt = '';

//                for(v of shopping) txt += v+"\n";

//                fs.writeFile(filename, txt, (err) => {

//                        if (err) throw err;

//                        console.log('The file has been saved!');

//                });

//        }

//        res.redirect("/shopping/");

//});


//CREATErud + Picture upload

router.post('/upload',(req, res) => {

    url = "";

    if(req.files && req.files.file) {

        req.files.file.mv('./public/images/' + req.files.file.name, (err) => {

            if (err) throw err;

        });

        url = '/images/' + req.files.file.name;

    }

       

    db.run(`

        INSERT INTO shopping(

            user,

            task,

            brand,

            url,

            date_created,

            date_modified

        ) VALUES (

            ?,

            ?,

            ?,

            ?,

            DATETIME('now','localtime'),

            DATETIME('now','localtime'));

        `,

        [req.session.username, req.body.task ||  "", req.body.brand, url],

        (err) => {

            if(err) throw err;

            res.redirect('/shopping/');

        });

});


//cruDELETE

router.post('/delete', (req, res) => {
        db.all('SELECT * FROM shopping WHERE id=? and user=?;', req.body.id, req.session.username, function(err, rows) {
                if(err) throw err;
                if(rows.length>0){
                        db.run('DELETE FROM shopping WHERE id = ?', req.body.id, (err) => {
                        if(err) throw err;
                        res.redirect('/shopping/');
                        });
                }
                else{
                        db.all('SELECT * FROM shopping ORDER BY date_modified DESC;', function(err, rows) {
                                if(err) throw err;
                                res.render('shopping', { info: "ACCESS DENIED", rows: rows, user:req.session.username });
                        });
                }
        });
        
        
        
});


//crUPDATEd

router.post('/update', (req, res) => {

    db.run(`UPDATE shopping

            SET user = ?,

                task = ?,

                brand = ?,

                url = ?,

                date_modified = DATETIME('now','localtime')

            WHERE id = ?;`,

        req.session.username,

        req.body.task,

        req.body.brand,

        req.body.url,

        req.body.id,

        (err) => {

            if(err) throw err;

            res.redirect('/shopping/');

    });

});


router.all('*', function(req, res) {

    res.send("No such page or action! Go to: <a href='/shopping/'>main page</a>");

});




module.exports = router;