
const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    trim: true
  },
  tipo: {
    type: String,
    enum: ['alumno', 'docente', 'admin'],
    required: [true, 'El tipo es obligatorio']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    match: [/.+@.+\..+/, 'Formato de email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Usuario', usuarioSchema);
