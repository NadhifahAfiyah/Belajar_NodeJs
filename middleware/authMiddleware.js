const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(request, response, next) {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return response.status(401).json({ error: 'Akses ditolak, token tidak ditemukan'});
    }

    jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
        if (err) {
            console.error("JWT Verify Error:", err.message);
            return response.status(403).json({ error: 'Token tidak valid atau kadaluwarsa'});
        }

        request.user = decodedPayload;
        next();
    });
}

module.exports = authenticateToken;