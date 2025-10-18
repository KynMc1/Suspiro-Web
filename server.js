// server.js

// ===== IMPORTS =====
import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

// ===== INICIALIZAR APP =====
const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// ===== DIRECTORIOS Y ARCHIVOS =====
const UPLOADS_DIR = path.join('./uploads');
const PEDIDOS_FILE = path.join('./pedidos.json');
const RESENAS_FILE = path.join('./resenas.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(PEDIDOS_FILE)) fs.writeFileSync(PEDIDOS_FILE, '[]');
if (!fs.existsSync(RESENAS_FILE)) fs.writeFileSync(RESENAS_FILE, '[]');

// ===== MULTER CONFIG =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ===== ENDPOINTS =====

// --- PEDIDOS ---
app.get('/api/pedidos', (req, res) => {
  const data = JSON.parse(fs.readFileSync(PEDIDOS_FILE, 'utf-8'));
  res.json(data);
});

app.post('/api/pedidos', upload.single('foto'), (req, res) => {
  const { nombre, producto, cantidad, direccion } = req.body;
  if (!nombre || !producto || !cantidad || !direccion)
    return res.status(400).json({ ok: false, msg: 'Faltan datos' });

  const pedido = {
    id: Date.now(),
    nombre,
    producto,
    cantidad,
    direccion,
    foto: req.file ? req.file.filename : null
  };

  const data = JSON.parse(fs.readFileSync(PEDIDOS_FILE, 'utf-8'));
  data.push(pedido);
  fs.writeFileSync(PEDIDOS_FILE, JSON.stringify(data, null, 2));

  res.json({ ok: true, pedido });
});

// --- RESEÑAS ---
app.get('/api/resenas', (req, res) => {
  const data = JSON.parse(fs.readFileSync(RESENAS_FILE, 'utf-8'));
  res.json(data);
});

app.post('/api/resenas', (req, res) => {
  const { nombre, comentario } = req.body;
  if (!nombre || !comentario) return res.status(400).json({ ok: false, msg: 'Faltan datos' });

  const resena = { id: Date.now(), nombre, comentario };
  const data = JSON.parse(fs.readFileSync(RESENAS_FILE, 'utf-8'));
  data.push(resena);
  fs.writeFileSync(RESENAS_FILE, JSON.stringify(data, null, 2));

  res.json({ ok: true, resena });
});

// ===== INICIAR SERVIDOR =====
const PORT = 3000;
app.listen(PORT, () => console.log(`Suspiro Web corriendo en http://localhost:${PORT}`));
