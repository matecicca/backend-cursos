// backend-escolar/index.js
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const usuariosRoutes = require('./routes/usuarios.routes.js');
const cursosRoutes = require('./routes/cursos.routes.js');
const inscripcionesRoutes = require('./routes/inscripciones.routes.js');

const app = express();

// CORS primero
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

console.log('🔐 CORS_ORIGINS configurado:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('📥 Petición desde origen:', origin);
    if (!origin) return callback(null, true); // Postman / healthchecks
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.error('❌ CORS bloqueado:', origin);
    return callback(new Error(`CORS bloqueado: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());

// Mongo
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/escolar';
mongoose.connect(MONGODB_URI).then(() => {
  console.log('MongoDB conectado');
}).catch(err => {
  console.error('Error MongoDB:', err.message);
});

// Prefijo API
app.get('/', (req, res) => {
  res.send('<h2>API Cursos v1</h2><p>Visite <a href="http://localhost:5173/documentacion">la documentación</a> para más detalles.</p>');
});
app.get('/api/health', (req,res)=> res.json({ ok:true, ts:Date.now() }));
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/inscripciones', inscripcionesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API en http://localhost:${PORT}`));
