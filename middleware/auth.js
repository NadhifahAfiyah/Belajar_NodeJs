const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(request, response, next) {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return response.status(401).json({ error:'token tidak ditemukan'});
    }

    jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
        if (err) {
            return response.status(403).json({ error: 'Token tidak valid'});
        }

        request.user = decodedPayload.user; // sekarang request.user berisi {id, username, role}
        next();
    });
}

// middleware autorisasi (baru)
function authorizeRole(role) {
    return (request, response, next) => {
        //middleware ini harus dijalankan setelah authenticateToken
        if (request.user && request.user.role === role) {
            next();
        } else {
            //pengguna terautentikasi, tetapi tidak memiliki ijin
            return response.status(403).json({error: 'Akses Dilarang: Peran tidak memadai'});
        }
    }
}

module.exports = { authenticateToken, authorizeRole};