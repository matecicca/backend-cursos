// models/inscripcion.model.js
const mongoose = require('mongoose');

const inscripcionSchema = new mongoose.Schema({
  alumno: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  curso: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Evita inscripciones duplicadas del mismo alumno al mismo curso.
 */
inscripcionSchema.index({ alumno: 1, curso: 1 }, { unique: true });

module.exports = mongoose.model('Inscripcion', inscripcionSchema);
