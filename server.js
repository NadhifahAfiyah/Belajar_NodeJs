require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dbMovies, dbDirectors} = require('./database.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken  = require('./middleware/authMiddleware.js');
const JWT_SECRET = process.env.JWT_SECRET;
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
// let directors = [
//     { id: 1, name: 'Peter Jackson', birthYear: 1967 },
//     { id: 2, name: 'Anthony Russo', birthYear: 1988 },
//     { id: 3, name: 'Sam Raimi', birthYear: 1975 },
// ];
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

app.post('/auth/register', (request, response) => {
    const { username, password } = request.body;
    if (!username || !password || password.length < 6) {
        return response.status(400).json({ error: 'username dan password (min 6 char) harus diisi' });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error("Error hashing:", err);
            return response.status(500).json({ error: 'Gagal memproses pendaftaran'});
        }

        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        const params = [username.toLowerCase(), hashedPassword];

        dbMovies.run(sql, params, function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return response.status(409).json({ error: 'Username sudah digunakan'});
                }
                console.error("Error inserting user:", err);
                return response.status(500).json({ error: 'Gagal menyimpan pengguna'});
            }
            response.status(201).json({ message: 'Registerasi berhasil', userId: this.lastID});
        });
    });

});

app.post('/auth/login', (request, response) => {
    const { username, password } = request.body;

    // Validasi input kosong
    if (!username || !password) {
        return response.status(400).json({ error: 'Username dan password harus diisi' });
    }

    // Cari user berdasarkan username
    const sql = 'SELECT * FROM users WHERE username = ?';
    dbMovies.get(sql, [username.toLowerCase()], (err, user) => {
        if (err) {
            console.error("Database error saat login:", err.message);
            return response.status(500).json({ error: 'Terjadi kesalahan pada server' });
        }

        // Jika user tidak ditemukan
        if (!user) {
            return response.status(401).json({ error: 'Kredensial tidak valid (user tidak ditemukan)' });
        }

        // Bandingkan password yang dimasukkan dengan yang di-hash di database
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error("Error membandingkan password:", err.message);
                return response.status(500).json({ error: 'Kesalahan verifikasi password' });
            }

            if (!isMatch) {
                return response.status(401).json({ error: 'Kredensial tidak valid (password salah)' });
            }

            // Buat token JWT
            const payload = { user: { id: user.id, username: user.username } };
            jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
                if (err) {
                    console.error("Error signing token:", err.message);
                    return response.status(500).json({ error: 'Gagal membuat token' });
                }

                // Kirimkan token ke client
                response.json({
                    message: 'Login berhasil',
                    token: token,
                    user: { id: user.id, username: user.username }
                });
            });
        });
    });
});


app.get('/movies', (request, response) => {
    const sql = 'SELECT * FROM movies  ORDER BY id ASC';
    dbMovies.all(sql, [], (err, rows) => {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        response.json(rows);
    });
});

app.get('/movies/:id', (request, response) => {
    const sql = 'SELECT * FROM movies WHERE id = ?';
    dbMovies.get(sql, [request.params.id], (err, row) => {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        if (row) {
            response.json(row);
        } else {
            response.status(404).json({ "error": "Movie not found" });
        }
    });
});


app.post('/movies', authenticateToken, (request, response) => {
    const { title, director, year } = request.body;
    if (!title || !director || !year) {
        return response.status(400).json({ error: 'title, director, year wajib diisi' });
    }

    const sql = 'INSERT INTO movies (title, director, year) VALUES (?,?,?)';
    dbMovies.run(sql, [title, director, year], function (err) {
        if (err) {
            return response.status(400).json({ "error": err.message });

        }
        response.status(201).json({ id: this.lastID, title, director, year});
    });
});


app.put('/movies/:id', authenticateToken, (request, response) => {
    const id = parseInt(request.params.id);
    const { title, director, year } = request.body;
    if (!title || !director || !year) {
        return response.status(400).json({ error: 'title, director, year wajib diisi' });
    }

    const sql = 'UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?';
    dbMovies.run(sql, [title, director, year, id], function (err) {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        response.json({ id, title, director, year });
    });
});

app.delete('/movies/:id', authenticateToken, (request, response) => {
    const id = parseInt(request.params.id);
    const sql = 'DELETE FROM movies WHERE id = ?';
    dbMovies.run(sql, [id], function (err) {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        response.status(204).send();
    });
});


// direktors
app.get('/directors', (request, response) => {
    const sql = 'SELECT * FROM directors';
    dbDirectors.all(sql, [], (err, rows) => {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        response.json(rows);
    });
});

app.get('/directors/:id', (request, response) => {
    const sql = 'SELECT * FROM directors WHERE id = ?';
    dbDirectors.get(sql, [request.params.id], (err, row) => {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        if (row) {
            response.json(row);
        } else {
            response.status(404).json({ "error": "Director not found" });
        }
    });
});

app.post('/directors', authenticateToken, (request, response) => {
    const { name, birthYear } = request.body;
    if (!name || !birthYear) {
        return response.status(400).json({ error: 'name, birthYear wajib diisi' });
    }
    const sql = 'INSERT INTO directors (name, birth_year) VALUES (?,?)';
    dbDirectors.run(sql, [name, birthYear], function (err) {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        response.status(201).json({ id: this.lastID, name, birthYear });
    });
});

app.put('/directors/:id', authenticateToken, (request, response) => {
    const id = parseInt(request.params.id);
    const { name, birthYear } = request.body;
    if (!name || !birthYear) {
        return response.status(400).json({ error: 'name, birthYear wajib diisi' });
    }
    const sql = 'UPDATE directors SET name = ?, birth_year = ? WHERE id = ?';
    dbDirectors.run(sql, [name, birthYear, id], function (err) {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        response.json({ id, name, birthYear });
    });
});

app.delete('/directors/:id', authenticateToken, (request, response) => {
    const id = parseInt(request.params.id);
    const sql = 'DELETE FROM directors WHERE id = ?';
    dbDirectors.run(sql, [id], function (err) {
        if (err) {
            return response.status(400).json({ "error": err.message });
        }
        response.status(204).send();
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