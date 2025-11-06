const sqlite3 = require('sqlite3').verbose();
const DB_SOURCE = process.env.DB_SOURCE;
const DB_SOURCE1 = process.env.DB_SOURCE1;

const dbMovies = new sqlite3.Database(DB_SOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

        // Create the movies table
        dbMovies.run(`CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            director TEXT NOT NULL,
            year INTEGER NOT NULL
        )`, (err) => {
            if (!err) {
                // Insert initial data if the table was just created
                const insert = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
                dbMovies.run(insert, ["LOTR", "Peter Jackson", 1999]);
                dbMovies.run(insert, ["Avengers", "Anthony Russo", 2019]);
                dbMovies.run(insert, ["Spiderman", "Sam Raimi", 2004]);
                console.log('Sample data inserted into movies table.');
            }
        });

        dbMovies.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error("Gagal membuat tabel users:", err.message);
            } else {
                console.log("Tabel users siap digunakan.");
            }
        });
    }
});


const dbDirectors = new sqlite3.Database(DB_SOURCE1, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');

                // Create the directors table
        dbDirectors.run(`CREATE TABLE IF NOT EXISTS directors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            birth_year INTEGER NOT NULL
        )`, (err) => {
            if (!err) {
                // Insert initial data if the table was just created
                const insert = 'INSERT INTO directors (name, birth_year) VALUES (?,?)';
                dbDirectors.run(insert, ["Peter Jackson", 1967]);
                dbDirectors.run(insert, ["Anthony Russo", 1988]);
                dbDirectors.run(insert, ["Sam Raimi", 1975]);
                console.log('Sample data inserted into directors table.');
            }
        });
    }
})

module.exports = {
    dbMovies,
    dbDirectors
};