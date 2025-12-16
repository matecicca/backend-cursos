// backend-escolar/routes/usuarios.routes.js
const express = require('express');
const router = express.Router();
const { check, param } = require('express-validator');
const { validar } = require('../middlewares/validation.js');
const c = require('../controllers/usuarios.controller.js');
const { validarToken, checkRole } = require('../middlewares/auth.js');

router.get('/', validarToken, c.getUsuarios);

router.get('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], validarToken, validar, c.getUsuarioById);

router.post('/', [
  check('nombre').isString().isLength({ min: 3 }).withMessage('Nombre mínimo 3 caracteres'),
  check('email').isEmail().withMessage('Email inválido'),
  check('password').isLength({ min: 6 }).withMessage('Password mínimo 6'),
  check('tipo').isIn(['alumno', 'docente', 'admin']).withMessage('Tipo debe ser alumno, docente o admin')
], validar, c.crearUsuario);

router.put('/:id', [
  param('id').isMongoId().withMessage('ID inválido'),
  check('nombre').optional().isString().isLength({ min: 3 }),
  check('email').optional().isEmail(),
  check('password').optional().isLength({ min: 6 }),
  check('tipo').optional().isIn(['alumno', 'docente', 'admin'])
], validarToken, checkRole(['admin']), validar, c.actualizarUsuario);

router.delete('/:id', [
  param('id').isMongoId().withMessage('ID inválido')
], validarToken, checkRole(['admin']), validar, c.eliminarUsuario);

router.post('/auth', [
  check('email').isEmail().withMessage('Email inválido'),
  check('password').isString().notEmpty().withMessage('Password requerida')
], validar, c.auth);

module.exports = router;