// middlewares/auth.js
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'dev_secret';

/**
 * Extrae el token desde Authorization (soporta "Bearer <token>" o el token plano).
 */
function extractToken(req) {
  const h = req.headers['authorization'] || req.headers['Authorization'];
  if (!h) return null;
  if (typeof h !== 'string') return null;
  const parts = h.trim().split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  // si vino el token solo sin "Bearer"
  return h.trim();
}

/**
 * Middleware: valida el JWT, retorna 401 si falta, 403 si es inválido/expirado.
 * Adjunta el payload en req.user.
 */
function validarToken(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ msg: 'Token requerido (use el header Authorization: Bearer <token>)' });
  }
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(403).json({ msg: 'Token inválido o expirado', error: err.message });
  }
}

/**
 * Middleware: verifica que el usuario tenga uno de los roles permitidos
 * Debe usarse DESPUÉS de validarToken
 * @param {string[]} rolesPermitidos - Array de roles que pueden acceder
 */
function checkRole(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Usuario no autenticado' });
    }

    const userRole = req.user.role;

    if (!rolesPermitidos.includes(userRole)) {
      return res.status(403).json({
        msg: 'No tienes permisos para realizar esta acción',
        requiredRoles: rolesPermitidos,
        yourRole: userRole
      });
    }

    return next();
  };
}

module.exports = { validarToken, checkRole };
