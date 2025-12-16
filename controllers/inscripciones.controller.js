// controllers/inscripciones.controller.js
const mongoose = require('mongoose');
const Usuario = require('../models/usuario.model.js');
const Curso = require('../models/curso.model.js');
const Inscripcion = require('../models/inscripcion.model.js');

const crearInscripcion = async (req, res) => {
  try {
    let alumnoId = req.body.alumno;
    let cursoInput = req.body.curso;

    // === Validar alumno (ID, email o nombre) ===
    if (mongoose.Types.ObjectId.isValid(alumnoId)) {
      const alumno = await Usuario.findOne({ _id: alumnoId, tipo: 'alumno' });
      if (!alumno) return res.status(400).json({ mensaje: 'El alumno no existe o no es válido' });
      alumnoId = alumno._id;
    } else if (typeof alumnoId === 'string' && alumnoId.includes('@')) {
      const alumno = await Usuario.findOne({ email: alumnoId, tipo: 'alumno' });
      if (!alumno) return res.status(400).json({ mensaje: 'El alumno no existe o no es válido' });
      alumnoId = alumno._id;
    } else if (typeof alumnoId === 'string') {
      const alumno = await Usuario.findOne({ nombre: new RegExp(alumnoId.trim(), 'i'), tipo: 'alumno' });
      if (!alumno) return res.status(400).json({ mensaje: 'El alumno no existe o no es válido' });
      alumnoId = alumno._id;
    } else {
      return res.status(400).json({ mensaje: 'Formato de alumno inválido' });
    }

    // === Validar que los alumnos solo se inscriban a sí mismos ===
    if (req.user && req.user.role === 'alumno') {
      if (req.user.id !== alumnoId.toString()) {
        return res.status(403).json({ mensaje: 'Los alumnos solo pueden inscribirse a sí mismos' });
      }
    }

    // === Validar curso (ID, classCode numérico o nombre exacto) ===
    let cursoDoc;
    if (mongoose.Types.ObjectId.isValid(cursoInput)) {
      cursoDoc = await Curso.findById(cursoInput);
    } else {
      const asNumber = Number(cursoInput);
      if (!Number.isNaN(asNumber)) {
        cursoDoc = await Curso.findOne({ classCode: asNumber });
      } else if (typeof cursoInput === 'string') {
        cursoDoc = await Curso.findOne({ nombre: new RegExp(`^${cursoInput.trim()}$`, 'i') });
      }
    }
    if (!cursoDoc) return res.status(400).json({ mensaje: 'El curso indicado no existe' });

    // === Validar que no exista inscripción previa (alumno, curso) ===
    const existe = await Inscripcion.findOne({ alumno: alumnoId, curso: cursoDoc._id });
    if (existe) {
      return res.status(400).json({ mensaje: 'El alumno ya está inscripto en este curso' });
    }

    // Crear
    const nueva = await Inscripcion.create({ alumno: alumnoId, curso: cursoDoc._id });
    return res.status(201).json(nueva);
  } catch (err) {
    // Duplicate key (índice único alumno+curso)
    if (err && err.code === 11000) {
      return res.status(400).json({ mensaje: 'Inscripción duplicada (alumno ya inscripto en este curso)' });
    }
    return res.status(500).json({ mensaje: err.message });
  }
};

// Obtener todas las inscripciones (filtro por alumno, curso o docente)
const getInscripciones = async (req, res) => {
  try {
    const { alumno, curso, docente } = req.query;
    const filtro = {};

    // Filtrar por alumno (ID, email o nombre)
    if (alumno) {
      if (mongoose.Types.ObjectId.isValid(alumno)) {
        const alumnoDoc = await Usuario.findOne({ _id: alumno, tipo: 'alumno' });
        if (!alumnoDoc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });
        filtro.alumno = alumnoDoc._id;
      } else if (typeof alumno === 'string' && alumno.includes('@')) {
        const alumnoDoc = await Usuario.findOne({ email: alumno, tipo: 'alumno' });
        if (!alumnoDoc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });
        filtro.alumno = alumnoDoc._id;
      } else if (typeof alumno === 'string') {
        const alumnoDoc = await Usuario.findOne({ nombre: new RegExp(alumno.trim(), 'i'), tipo: 'alumno' });
        if (!alumnoDoc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });
        filtro.alumno = alumnoDoc._id;
      } else {
        return res.status(400).json({ mensaje: 'Parámetro alumno inválido' });
      }
    }

    // Filtrar por curso (ID, classCode o nombre)
    if (curso) {
      let cursoDoc;
      if (mongoose.Types.ObjectId.isValid(curso)) {
        cursoDoc = await Curso.findById(curso);
      } else {
        const asNumber = Number(curso);
        if (!Number.isNaN(asNumber)) {
          cursoDoc = await Curso.findOne({ classCode: asNumber });
        } else if (typeof curso === 'string') {
          cursoDoc = await Curso.findOne({ nombre: new RegExp(curso.trim(), 'i') });
        } else {
          return res.status(400).json({ mensaje: 'Parámetro curso inválido' });
        }
      }
      if (!cursoDoc) return res.status(404).json({ mensaje: 'Curso no encontrado' });
      filtro.curso = cursoDoc._id;
    }

    // Filtrar por docente (nombre → resuelve docentes → cursos del docente)
    if (docente) {
      if (typeof docente !== 'string' || !docente.trim()) {
        return res.status(400).json({ mensaje: 'Parámetro docente inválido' });
      }
      const docentes = await Usuario.find({ nombre: new RegExp(docente.trim(), 'i'), tipo: 'docente' });
      if (!docentes.length) return res.status(404).json({ mensaje: 'Docente no encontrado' });

      const cursosDocente = await Curso.find({ docente: { $in: docentes.map(d => d._id) } });
      if (!cursosDocente.length) return res.status(404).json({ mensaje: 'No se encontraron cursos para este docente' });

      filtro.curso = { $in: cursosDocente.map(c => c._id) };
    }

    // Buscar inscripciones con populate
    const inscripciones = await Inscripcion.find(filtro)
      .populate('alumno', 'nombre email tipo')
      .populate({
        path: 'curso',
        select: 'nombre classCode fecha docente',
        populate: { path: 'docente', select: 'nombre email' }
      });

    res.json(inscripciones);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// Eliminar inscripción
const eliminarInscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    // Buscar la inscripción antes de eliminar
    const inscripcion = await Inscripcion.findById(id);
    if (!inscripcion) return res.status(404).json({ mensaje: 'Inscripción no encontrada' });

    // Debug logs
    console.log('[DEBUG] Desinscripción - User role:', req.user?.role);
    console.log('[DEBUG] Desinscripción - User ID:', req.user?.id);
    console.log('[DEBUG] Desinscripción - Inscripción alumno ID:', inscripcion.alumno.toString());

    // Si el usuario es alumno, validar que solo pueda desinscribirse a sí mismo
    if (req.user && req.user.role === 'alumno') {
      if (req.user.id !== inscripcion.alumno.toString()) {
        console.log('[DEBUG] Acceso denegado: IDs no coinciden');
        return res.status(403).json({
          mensaje: 'Los alumnos solo pueden desinscribirse a sí mismos',
          debug: {
            userRole: req.user.role,
            userId: req.user.id,
            inscripcionAlumnoId: inscripcion.alumno.toString()
          }
        });
      }
    }

    // Eliminar la inscripción
    await Inscripcion.findByIdAndDelete(id);
    console.log('[DEBUG] Inscripción eliminada exitosamente');
    res.json({ mensaje: 'Inscripción eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  crearInscripcion,
  getInscripciones,
  eliminarInscripcion
};
