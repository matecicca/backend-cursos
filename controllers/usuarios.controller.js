// backend-escolar/controllers/usuarios.controller.js
const Usuario = require('../models/usuario.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'dev_secret';

// GET /api/usuarios?tipo=&nombre=
const getUsuarios = async (req, res) => {
  try {
    const { tipo, nombre } = req.query;
    const filtro = {};
    if (tipo) filtro.tipo = tipo;
    if (nombre) filtro.nombre = new RegExp(nombre, 'i');
    const usuarios = await Usuario.find(filtro).select('-password');
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const getUsuarioById = async (req, res) => {
  try {
    const u = await Usuario.findById(req.params.id).select('-password');
    if (!u) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json(u);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, tipo } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email y password son requeridos' });

    // Validar que solo admin puede crear usuarios con rol 'admin'
    if (tipo === 'admin') {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Solo los administradores pueden crear otros administradores' });
      }
    }

    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(409).json({ msg: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 10);
    const nuevo = await Usuario.create({ nombre, email, password: hash, tipo: tipo || 'alumno' });
    res.status(201).json({ id: nuevo._id, nombre: nuevo.nombre, email: nuevo.email, tipo: nuevo.tipo });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

const actualizarUsuario = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    const upd = await Usuario.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
    if (!upd) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json(upd);
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

const eliminarUsuario = async (req, res) => {
  try {
    const del = await Usuario.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ msg: 'Usuario no encontrado' });
    res.json({ msg: 'Usuario eliminado' });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

const auth = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ msg: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok) return res.status(400).json({ msg: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, role: usuario.tipo || 'user' },
      SECRET_KEY,
      { expiresIn: '2h' }
    );
    res.json({ token, user: { id: usuario._id, nombre: usuario.nombre, email: usuario.email, tipo: usuario.tipo } });
  } catch (err) { res.status(500).json({ msg: err.message }); }
};

module.exports = { getUsuarios, getUsuarioById, crearUsuario, actualizarUsuario, eliminarUsuario, auth };
