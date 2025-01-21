// server.js

// ========== Importaciones y configuración inicial ==========
const express = require('express');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== Inicializar Firebase Admin ==========
const admin = require('firebase-admin');

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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ========== Endpoints existentes ==========

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// ========== Endpoints para Firestore (Tabla PackRate) ==========
// Endpoint para guardar PackRate (crear o actualizar)
app.post('/api/packrate', async (req, res) => {
    try {
        const packRateData = req.body;
        packRateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        if (packRateData.groupId) {
            await db.collection('packrate').doc(packRateData.groupId).set(packRateData, { merge: true });
            res.status(200).json({ message: "Documento actualizado" });
        } else {
            packRateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
            const docRef = await db.collection('packrate').add(packRateData);
            res.status(200).json({ id: docRef.id });
        }
    } catch (error) {
        console.error('Error al guardar PackRate:', error);
        res.status(500).json({ error: 'Error al guardar PackRate' });
    }
});


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

// ========== Configurar el puerto y arrancar el servidor ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor disponible en http://localhost:${PORT} o en http://<TU-IP-LOCAL>:${PORT}`);
});
