const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = 'movies-api.db';

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        // Create the movies table
        db.run(`CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            director TEXT NOT NULL,
            year INTEGER NOT NULL
        )`, (err) => {
            if (!err) {
                // Insert initial data if the table was just created
                const insert = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
                db.run(insert, ["LOTR", "Peter Jackson", 1999]);
                db.run(insert, ["Avengers", "Anthony Russo", 2019]);
                db.run(insert, ["Spiderman", "Sam Raimi", 2004]);
                console.log('Sample data inserted into movies table.');
            }
        });

        // Create the directors table
        db.run(`CREATE TABLE IF NOT EXISTS directors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            birth_year INTEGER NOT NULL
        )`, (err) => {
            if (!err) {
                // Insert initial data if the table was just created
                const insert = 'INSERT INTO directors (name, birth_year) VALUES (?,?)';
                db.run(insert, ["Peter Jackson", 1967]);
                db.run(insert, ["Anthony Russo", 1988]);
                db.run(insert, ["Sam Raimi", 1975]);
                console.log('Sample data inserted into directors table.');
            }
        });
    }
});

module.exports = db;