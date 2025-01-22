// server.js

// ========== 1. IMPORTACIONES Y CONFIGURACIÓN INICIAL ==========
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer();

// Configuración básica
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// ========== 2. INICIALIZAR FIREBASE ADMIN ==========
const admin = require('firebase-admin');

// Verificar variable de entorno con credenciales Firebase
if (!process.env.FIREBASE_CREDENTIALS) {
  console.error('ERROR: La variable de entorno FIREBASE_CREDENTIALS no está definida.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
} catch (error) {
  console.error('ERROR: La variable FIREBASE_CREDENTIALS no contiene un JSON válido.', error);
  process.exit(1);
}

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// ========== 3. ENDPOINTS PRINCIPALES (INVENTARIO, PACKRATE, ETC.) ==========

// --- 3.1. Endpoint raíz ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 3.2. Endpoint para enviar email (con archivo adjunto) ---
app.post('/send-email', upload.single('file'), (req, res) => {
  const { toEmail } = req.body;
  const file = req.file;

  if (!toEmail || !file) {
    return res.status(400).send('Faltan datos');
  }

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'fabio.gomez@fli.com.co',
      pass: 'lgepmrsgvwqhihsk'
    }
  });

  let mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Inventario',
    text: `Fecha de envío: ${new Date().toLocaleString()}`,
    attachments: [
      {
        filename: 'Inventario.xlsx',
        content: file.buffer
      }
    ]
  };

  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.error(error);
      res.status(500).send('Error al enviar el correo');
    } else {
      console.log('Correo enviado: ' + info.response);
      res.send('Correo enviado');
    }
  });
});


// ========== 4. ENDPOINTS PARA FIRESTORE: PACKRATE ==========

// --- 4.1. Crear o actualizar PACKRATE ---
app.post('/api/packrate', async (req, res) => {
  try {
    const packRateData = req.body;
    packRateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    if (packRateData.groupId) {
      // Actualizar documento existente
      await db.collection('packrate').doc(packRateData.groupId).set(packRateData, { merge: true });
      res.status(200).json({ message: "Documento actualizado" });
    } else {
      // Crear nuevo documento
      packRateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const docRef = await db.collection('packrate').add(packRateData);
      res.status(200).json({ id: docRef.id });
    }
  } catch (error) {
    console.error('Error al guardar PackRate:', error);
    res.status(500).json({ error: 'Error al guardar PackRate' });
  }
});

// --- 4.2. Obtener todos los PACKRATE ---
app.get('/api/packrate', async (req, res) => {
  try {
    const snapshot = await db.collection('packrate').get();
    const packrateList = [];
    snapshot.forEach(doc => {
      packrateList.push({ groupId: doc.id, ...doc.data() });
    });
    res.status(200).json(packrateList);
  } catch (error) {
    console.error('Error al obtener PackRate:', error);
    res.status(500).json({ error: 'Error al obtener PackRate' });
  }
});


// ========== 5. ENDPOINT PARA FIRESTORE: INVENTARIO ==========

// Nota: NO se implementa el punto #3 (GET global), por lo tanto solo hacemos POST (upsert).
app.post('/api/inventario', async (req, res) => {
  try {
    const { variety, tipoRamo, long, bunchesTotal } = req.body;

    if (!variety || !tipoRamo || !long) {
      return res.status(400).json({ error: 'Faltan campos (variety, tipoRamo, long)' });
    }

    // Construimos un ID basado en variety, tipoRamo y long
    const docId = `${variety.toUpperCase()}_${tipoRamo.toUpperCase()}_${long}`;

    // Hacemos el set con merge: true
    await db.collection('inventario').doc(docId).set({
      variety,
      tipoRamo,
      long,
      bunchesTotal: parseInt(bunchesTotal) || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.status(200).json({ id: docId, status: 'updated' });
  } catch (error) {
    console.error('Error al guardar Inventario:', error);
    res.status(500).json({ error: 'Error al guardar Inventario' });
  }
});


// ========== 6. CONFIGURAR EL PUERTO Y ARRANCAR EL SERVIDOR ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor disponible en http://localhost:${PORT} o en http://<TU-IP-LOCAL>:${PORT}`);
});
