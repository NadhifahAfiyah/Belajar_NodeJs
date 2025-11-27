require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db.js'); // menggunakan modul pg baru
const bcrypt = require('bcrypt.js');
const jwt = require('jsonwebtoken');
const {authenticateToken, authorizeRole} = require('./middleware/auth.js');

const app = express();
const PORT = process.env.PORT || 3300;
const JWT_SECRET = process.env.JWT_SECRET;

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === ROUTES ===
app.get('status', (request, response) => {
    response.json({ok: true, service:'film-api'});l
});

// === AUTH ROUTES (Refactored for pg) ===
app.post('auth/register', async (request, response, next) => {
    const {username, password} = request.body;
    if (!username || !password || password.length < 6) {
        return response.status(400).json({error: 'Username dan password (min 6 char) harus diisi'});
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username';
        const result = await db.query(sql, [username.toLowerCase(), hashedPassword, 'user']);
        response.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return response.status(409).json({error: 'Username sudah digunakan'});
        }
        next(err);
    }
});

app.post('auth/register-admin', async (request, response, next) => {
    const {username, password} = request.body;
    if (!username || !password || password.length < 6) {
        return response.status(400).json({error: 'Username dan password (min 6 char) harus diisi'});
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sql = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username';
        const result = await db.query(sql, [username.toLowerCase(), hashedPassword, 'admin']);
        response.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return response.status(409).json({error: 'Username sudah digunakan'});
        }
        next(err);
    }
});

app.post('auth/login', async (request, response, next) => {
    const {username, password} = request.body;
    try {
        const sql = 'SELECT * FROM users WHERE username = $1';
        const result = await db.query(sql, [username.toLowerCase()]);
        const user = result.rows[0];
        if (!user) {
            return response.status(401).json({error: 'Kredensial username or password'});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return response.status(401).json({error: 'Kredensial username or password'});
        }
        const payload = {user: {id: user.id, username: user.username, role: user.role}};
        const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '1h'});
        response.json({token});
    } catch (err) {
        next(err);
    }
});

// === MOVIE ROUTES (Refactored for pg) ===
app.get('/movies', async (request, response, next) => {
    const sql = `SELECT m.id, m.title, m.year, d.id as director_id, d.name as director_name FROM movies m LEFT JOIN directors d ON m.director_id = d.id ORDER BY m.id ASC`;
    try {
        const result = await db.query(sql);
        response.json(result.rows);   
    } catch (err) {
        next(err);
    }
});

app.get('/movies/:id', async (request, response, next) => {
    const sql = `SELECT m.id, m.title, m.year, d.id as director_id, d.name as director_name FROM movies m LEFT JOIN directors d ON m.director_id = d.id WHERE m.id = $1`;
    try {
        const result = await db.query(sql, [request.params.id]);
        if (result.rows.length === 0) {
            return response.status(404).json({error: 'Film tidak ditemukan'});
        }
        response.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.post('/movies', authenticateToken, authorizeRole('admin'), async (request, response, next) => {
    const {title, year, director_id} = request.body;
    if (!title ||!director_id || !year) {
        return response.status(400).json({error: 'Title, director_id, dan year harus diisi'});
    }
    const sql = 'INSERT INTO movies (title, year, director_id) VALUES ($1, $2, $3) RETURNING *';
    try {
        const result = await db.query(sql, [title, year, director_id]);
        response.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.put('/movies/:id', authenticateToken, authorizeRole('admin'), async (request, response, next) => {
    const {title, year, director_id} = request.body;
    const sql = 'UPDATE movies SET title = $1, year = $2, director_id = $3 WHERE id = $4 RETURNING *';
    try {
        const result = await db.query(sql, [title, year, director_id, request.params.id]);
        if (result.rows.length === 0) {
            return response.status(404).json({error: 'Film tidak ditemukan'});
        }
    } catch (err) {
        next(err);
    }
});

app.delete('movies/:id', authenticateToken, authorizeRole('admin'), async (request, response, next) => {
    const sql = 'DELETE FROM movies WHERE id = $1 RETURNING *';
    try {
        const result = await db.query(sql, [request.params.id]);
        if (result.rows.length === 0) {
            return response.status(404).json({error: 'Film tidak ditemukan'});
        }
        response.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// DIRECTOR ROUTES (TUGAS PRAKTIKUM) ===
// MAHASISWA HARUS ME-REFACTOR ENDPOINT /DIRECTORS DENGAN POLA YANG SAMA

// === FALLBACK & ERROR HANDLING ===
app.use ((request, response) => {
    response.status(404).json({error: 'route tidak ditemukan'});
});

app.use ((err, request, response, next) => {
    console.error('[SERVER ERROR]', err.stack);
    response.status(500).json({error: 'terjadi kesalahan pada server'});
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan pada http://localhost:${PORT}`);
});