// routes/cursos.routes.js
const express = require('express');
const router = express.Router();
const { check, param } = require('express-validator');
const { validar } = require('../middlewares/validation.js');
const controlador = require('../controllers/cursos.controller.js');
const { validarToken, checkRole } = require('../middlewares/auth.js');

router.get('/', validarToken, controlador.getCursos);

router.get('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], validarToken, validar, controlador.getCursoById);

// Endpoint para obtener alumnos de un curso
router.get('/:id/alumnos', [
  param('id').isMongoId().withMessage('ID inválido')
], validarToken, validar, controlador.getAlumnosInscritos);

// Solo admin puede crear cursos
router.post('/', [
  check('nombre').isString().notEmpty(),
  check('descripcion').isString().notEmpty(),
  check('docente').isString().notEmpty(),
  check('fecha').isISO8601().withMessage('Fecha ISO 8601 requerida'),
  check('classCode').isInt({ min: 1, max: 15 }).withMessage('classCode 1..15')
], validarToken, checkRole(['admin']), validar, controlador.crearCurso);

// Solo admin puede editar cursos
router.put('/:id', [
  param('id').isMongoId().withMessage('ID inválido'),
  check('nombre').optional().isString().notEmpty(),
  check('descripcion').optional().isString().notEmpty(),
  check('docente').optional().isString().notEmpty(),
  check('fecha').optional().isISO8601(),
  check('classCode').optional().isInt({ min: 1, max: 15 })
], validarToken, checkRole(['admin']), validar, controlador.actualizarCurso);

// Solo admin puede eliminar cursos
router.delete('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], validarToken, checkRole(['admin']), validar, controlador.eliminarCurso);

module.exports = router;
