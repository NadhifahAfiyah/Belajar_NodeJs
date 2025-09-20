require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const app = express();
const port = process.env.PORT || 3100;
app.use(cors());
//const port = 3100;

// app.use(cors());
app.use(express.json());

// Dummy data movies
/*let movies = [
    { id: 1, title: 'LOTR', director: 'Peter Jackson', year: 1999 },
    { id: 2, title: 'Avengers', director: 'Anthony Russo', year: 2019 },
    { id: 3, title: 'Spiderman', director: 'Sam Raimi', year: 2004 },
];*/
//console.log(movies);

// dummy data directors
let directors = [
    { id: 1, name: 'Peter Jackson', birthYear: 1967 },
    { id: 2, name: 'Anthony Russo', birthYear: 1988},
    { id: 3, name: 'Sam Raimi', birthYear: 1975 },
];
//console.log(directors);

/*
app.get('/', (request, response) => {
    response.send('Selamat Datang diserver Node.js, terimkasih sudah mampir');
}); */

app.get('/status', (request, response) => {
    response.json({
        status: 'OK',
        message: 'server is running',
        timestamp: new Date(),
    });
});

app.get('/movies', (request, response) => {
    const sql = 'SELECT * FROM movies';
    db.all(sql, [], (err, rows) => {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }
        response.json({
            'message': 'success',
            'data': rows
        });
    });
});

app.get('/movies/:id', (request, response) => {
    const sql = 'SELECT * FROM movies WHERE id = ?';
    db.get(sql, [request.params.id], (err, row) => {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }
        if (!row) {
            response.status(404).json({ "error": "Movie not found" });
            return;
        }
        response.json({
            'message': 'success',
            'data': row
        });
    });
});


app.post('/movies', (request, response) => {
    const { title, director, year } = request.body;
    if (!title || !director || !year) {
        return response.status(400).json({ error: 'title, director, year wajib diisi' });
    }

    const sql = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
    db.run(sql, [title, director, year], function(err) {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }
        response.status(201).json({
            'message': 'success',
            'data': { id: this.lastID, title, director, year }
        });
    });
});

app.put('/movies/:id', (request, response) => {
    const id = parseInt(request.params.id);
    const { title, director, year } = request.body;  
    if (!title || !director || !year) {
        return response.status(400).json({ error: 'title, director, year wajib diisi' });
    }

    const sql = 'UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?';
    db.run(sql, [title, director, year, id], function(err) {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }
        response.json({
            'message': 'success',
            'data': { id, title, director, year }
        });
    });
});

app.delete('/movies/:id', (request, response) => {
    const id = parseInt(request.params.id);
    const sql = 'DELETE FROM movies WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }
        response.json({
            'message': 'success',
            'data': { id }
        });
    });
});


// direktors
app.get('/directors', (request, response) => {
    const sql = 'SELECT * FROM directors';
    db.all(sql, [], (err, rows) => {
        if (err) { 
            response.status(400).json({ "error": err.message });
            return;
        }
        response.json({
            'message': 'success',
            'data': rows
        });
    });
});

app.get('/directors/:id', (request, response) => {  
    const sql = 'SELECT * FROM directors WHERE id = ?';
    db.get(sql, [request.params.id], (err, row) => {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }
        if (!row) {
            response.status(404).json({ "error": "Director not found" });
            return;
        }       
        response.json({
            'message': 'success',
            'data': row
        });
    });
});

app.post('/directors', (request, response) => {
    const { name, birthYear } = request.body;
    if (!name || !birthYear) {
        return response.status(400).json({ error: 'name, birthYear wajib diisi' });
    }
    const sql = 'INSERT INTO directors (name, birth_year) VALUES (?,?)';
    db.run(sql, [name, birthYear], function(err) {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }
        response.status(201).json({
            'message': 'success',
            'data': { id: this.lastID, name, birthYear }
        });
    });
});

app.put('/directors/:id', (request, response) => {
    const id = parseInt(request.params.id);   
    const { name, birthYear } = request.body;  
    if (!name || !birthYear) {
        return response.status(400).json({ error: 'name, birthYear wajib diisi' });
    }
    const sql = 'UPDATE directors SET name = ?, birth_year = ? WHERE id = ?';
    db.run(sql, [name, birthYear, id], function(err) {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }   
        response.json({
            'message': 'success',
            'data': { id, name, birthYear }
        });
    });
});

app.delete('/directors/:id', (request, response) => {   
    const id = parseInt(request.params.id);
    const sql = 'DELETE FROM directors WHERE id = ?';       
    db.run(sql, [id], function(err) {
        if (err) {
            response.status(400).json({ "error": err.message });
            return;
        }
        response.json({
            'message': 'success',
            'data': { id }
        });
    });
}); 

//handle 404
app.use((request, response) => {
    response.status(404).json({ error: 'Not Found' });
});

// information server listening
app.listen(port, () => {
    console.log(`Server running on localhost: ${port}`);
});



/*app.get('/api/movies', (request, response) => {
    response.json(movies);
});

app.get('/api/directors', (request, response) => {
    response.json(directors);
});

app.get('/api/movies/:id', (request, response) => {
    const movie = movies.find(movie => movie.id === parseInt(request.params.id));
    if (movie) {
        response.json(movie);
    } else {
        response.status(404).send('Movie not found');
    }
});

//get directors
app.get('/api/directors/:id', (request, response) => {
    const director = directors.find(director => director.id === parseInt(request.params.id));
    if (director) {
        response.json(director);
    } else {
        response.status(404).send('Director not found');
    } 
});

// post /movies - membuat film baru
app.post('/api/movies', (request, response) => {
    const { title, director, year } = request.body || {};
    if (!title || !director || !year) {
        return response.status(400).json({ error: 'title, director, year wajib diisi' });
    }
    const newMovie = { id: movies.length + 1, title, director, year };
    movies.push(newMovie);
    response.status(201).json(newMovie);
});

// post /directors - membuat director baru
app.post('/api/directors', (request, response) => {
    const { name, birthYear } = request.body || {};
    if (!name || !birthYear) {
        return response.status(400).json({ error: 'name, birthYear wajib diisi' });
    }
    const newDirector = { id: directors.length + 1, name, birthYear };
    directors.push(newDirector);
    response.status(201).json(newDirector);
});

// put /movies/:id - memperbarui data film
app.put('/api/movies/:id', (request, response) => {
    const id = Number(request.params.id);
    const movieIndex = movies.findIndex(m => m.id === id);
    if (movieIndex === -1) {
        return response.status(404).json({ error: 'Movie tidak ditemukan' });
    }
    const { title, director, year } = request.body || {};
    const updatedMovie = { id, title, director, year };
    movies[movieIndex] = updatedMovie;
    response.json(updatedMovie);
});

// put /directors/:id - memperbarui data director
app.put('/api/directors/:id', (request, response) => {
    const id = parseInt(request.params.id);   
    const directorIndex = directors.findIndex(d => d.id === id);
    if (directorIndex === -1) {
        return response.status(404).json({ error: 'Director tidak ditemukan' });
    }   
    const { name, birthYear } = request.body || {};
    const updatedDirector = { id, name, birthYear };
    directors[directorIndex] = updatedDirector;
    response.json(updatedDirector);
});

// delete /movies/:id - menghapus data film
app.delete('/api/movies/:id', (request, response) => {
    const id = Number(request.params.id);
    const movieIndex = movies.findIndex(m => m.id === id);
    if (movieIndex === -1) {
        return response.status(404).json({ error: 'Movie tidak ditemukan' });
    }
    movies.splice(movieIndex, 1);
    response.status(204).end();
});

// delete /directors/:id - menghapus data director
app.delete('/api/directors/:id', (request, response) => {
    const id = parseInt(request.params.id);
    const directorIndex = directors.findIndex(d => d.id === id);
    if (directorIndex === -1) {
        return response.status(404).json({ error: 'Director tidak ditemukan' });
    }   
    directors.splice(directorIndex, 1);
    response.status(204).end();
});

// app.listen(port, () => {
//     console.log(`Server is running on localhost: ${port}`);
// }); */