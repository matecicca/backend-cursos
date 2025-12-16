const { check, param } = require('express-validator');
const { validar } = require('../middlewares/validation.js');
const express = require('express');
const router = express.Router();
const { crearInscripcion, getInscripciones, eliminarInscripcion } = require('../controllers/inscripciones.controller.js');
const { validarToken, checkRole } = require('../middlewares/auth.js');

router.get('/', validarToken, getInscripciones);

// Admin y alumnos pueden crear inscripciones
// Los alumnos solo pueden inscribirse a sí mismos (se valida en controlador)
router.post('/', [
  check('alumno').isString().notEmpty().withMessage('alumno requerido'),
  check('curso').isString().notEmpty().withMessage('curso requerido')
], validarToken, checkRole(['admin', 'alumno']), validar, crearInscripcion);

// Admin, docentes y alumnos pueden eliminar inscripciones
// Los alumnos solo pueden desinscribirse a sí mismos (se valida en controlador)
router.delete('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], validarToken, checkRole(['admin', 'docente', 'alumno']), validar, eliminarInscripcion);

module.exports = router;
