// middlewares/validation.js
const { validationResult } = require('express-validator');

/**
 * Recolecta errores de express-validator y responde 400.
 * Estructura: { errors: [{ field, msg, location }] }
 */
const validar = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const formatted = result.array().map(e => ({
      field: e.path,
      msg: e.msg,
      location: e.location
    }));
    return res.status(400).json({ errors: formatted });
  }
  next();
};

module.exports = { validar };
