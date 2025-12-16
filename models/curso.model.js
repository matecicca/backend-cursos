// models/curso.model.js
const mongoose = require('mongoose');

const cursoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del curso es obligatorio'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria']
  },
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El docente es obligatorio']
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha del curso es obligatoria']
  },
  classCode: {
    type: Number,
    required: [true, 'El código del curso es obligatorio'],
    unique: true,
    min: 1,
    max: 15
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Curso', cursoSchema);
