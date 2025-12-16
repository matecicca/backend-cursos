// controllers/cursos.controller.js
const mongoose = require('mongoose');
const Usuario = require('../models/usuario.model.js');
const Curso = require('../models/curso.model.js');

// Crear curso
const crearCurso = async (req, res) => {
  try {
    let docenteId = req.body.docente;

    // Validar docente (igual que antes)
    if (mongoose.Types.ObjectId.isValid(docenteId)) {
      const docente = await Usuario.findOne({ _id: docenteId, tipo: 'docente' });
      if (!docente) return res.status(400).json({ mensaje: 'El docente no existe o no es válido' });
    } else {
      const docente = await Usuario.findOne({ email: docenteId, tipo: 'docente' });
      if (!docente) return res.status(400).json({ mensaje: 'El docente no existe o no es válido' });
      docenteId = docente._id;
    }

    // 🚨 Validar límite de cursos
    const totalCursos = await Curso.countDocuments();
    if (totalCursos >= 15) {
      return res.status(400).json({ mensaje: 'No hay espacio: ya existen 15 cursos registrados' });
    }

    // 🚨 Validar que el classCode no esté repetido
    const existeClassCode = await Curso.findOne({ classCode: req.body.classCode });
    if (existeClassCode) {
      return res.status(400).json({ mensaje: `El classCode ${req.body.classCode} ya está en uso` });
    }

    // Crear curso
    const nuevoCurso = new Curso({
      ...req.body,
      docente: docenteId
    });

    const cursoGuardado = await nuevoCurso.save();
    res.status(201).json(cursoGuardado);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// Obtener todos los cursos (con filtros por docente y nombre)
const getCursos = async (req, res) => {
  try {
    const { docente, nombre } = req.query;
    let filtro = {};

    // 🔹 Filtro por docente (ID, email o nombre)
    if (docente) {
      if (mongoose.Types.ObjectId.isValid(docente)) {
        const existeDocente = await Usuario.findOne({ _id: docente, tipo: 'docente' });
        if (!existeDocente) return res.status(404).json({ mensaje: 'Docente no encontrado' });
        filtro.docente = docente;
      } else if (docente.includes('@')) {
        const docenteEncontrado = await Usuario.findOne({ email: docente, tipo: 'docente' });
        if (!docenteEncontrado) return res.status(404).json({ mensaje: 'Docente no encontrado' });
        filtro.docente = docenteEncontrado._id;
      } else {
        // Buscar por nombre con RegExp
        const docentes = await Usuario.find({ nombre: new RegExp(docente.trim(), 'i'), tipo: 'docente' });
        if (!docentes.length) return res.status(404).json({ mensaje: 'Docente no encontrado' });
        filtro.docente = { $in: docentes.map(d => d._id) };
      }
    }

    // 🔹 Filtro por nombre de curso
    if (nombre) {
      filtro.nombre = new RegExp(nombre.trim(), 'i');
    }

    const cursos = await Curso.find(filtro).populate('docente', 'nombre email tipo');
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// Obtener un curso por ID con info del docente
const getCursoById = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id).populate('docente', 'nombre email tipo');
    if (!curso) return res.status(404).json({ mensaje: 'Curso no encontrado' });
    res.json(curso);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

const actualizarCurso = async (req, res) => {
  try {
    let docenteId = req.body.docente;

    // Validar docente si se envía uno nuevo
    if (docenteId) {
      if (mongoose.Types.ObjectId.isValid(docenteId)) {
        const docente = await Usuario.findOne({ _id: docenteId, tipo: 'docente' });
        if (!docente) {
          return res.status(400).json({ mensaje: 'El docente no existe o no es válido' });
        }
      } else {
        const docente = await Usuario.findOne({ email: docenteId, tipo: 'docente' });
        if (!docente) {
          return res.status(400).json({ mensaje: 'El docente no existe o no es válido' });
        }
        docenteId = docente._id;
      }
      req.body.docente = docenteId;
    }

    // Validar que el nuevo classCode no esté repetido
    if (req.body.classCode) {
      const existeClassCode = await Curso.findOne({
        classCode: req.body.classCode,
        _id: { $ne: req.params.id }
      });
      if (existeClassCode) {
        return res.status(400).json({ mensaje: `El classCode ${req.body.classCode} ya está en uso` });
      }
    }

    const curso = await Curso.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('docente', 'nombre email tipo');

    if (!curso) return res.status(404).json({ mensaje: 'Curso no encontrado' });

    res.json(curso);
  } catch (error) {
    res.status(400).json({ mensaje: error.message });
  }
};

// Eliminar curso
const eliminarCurso = async (req, res) => {
  try {
    const Inscripcion = require('../models/inscripcion.model.js');

    // Verificar si el curso existe
    const curso = await Curso.findById(req.params.id);
    if (!curso) return res.status(404).json({ mensaje: 'Curso no encontrado' });

    // Verificar si hay inscripciones asociadas a este curso
    const inscripciones = await Inscripcion.countDocuments({ curso: req.params.id });
    if (inscripciones > 0) {
      return res.status(400).json({
        mensaje: `No se puede eliminar el curso porque tiene ${inscripciones} inscripción${inscripciones > 1 ? 'es' : ''} asociada${inscripciones > 1 ? 's' : ''}`
      });
    }

    // Si no hay inscripciones, eliminar el curso
    await Curso.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Curso eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

// Obtener alumnos inscritos en un curso
const getAlumnosInscritos = async (req, res) => {
  try {
    const Inscripcion = require('../models/inscripcion.model.js');
    const cursoId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(cursoId)) {
      return res.status(400).json({ mensaje: 'ID de curso inválido' });
    }

    const curso = await Curso.findById(cursoId);
    if (!curso) {
      return res.status(404).json({ mensaje: 'Curso no encontrado' });
    }

    const inscripciones = await Inscripcion.find({ curso: cursoId })
      .populate('alumno', 'nombre email tipo')
      .sort({ createdAt: -1 });

    const alumnos = inscripciones.map(insc => ({
      inscripcionId: insc._id,
      alumno: insc.alumno,
      fechaInscripcion: insc.createdAt
    }));

    res.json(alumnos);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  getCursos,
  getCursoById,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  getAlumnosInscritos
};
