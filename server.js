// server.js

// ========== Importaciones y configuración inicial ==========
const express = require('express');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer'); // Para envío de correos
const multer = require('multer');          // Para manejo de archivos en formularios
const upload = multer();
const cors = require('cors');              // Para CORS
require('dotenv').config();               // Cargar variables de entorno desde .env

// Habilitar CORS para todas las solicitudes
app.use(cors());
// Para poder interpretar JSON en las peticiones POST
app.use(express.json());

// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// ========== Inicializar Firebase Admin ==========
const admin = require('firebase-admin');

// Verificar que FIREBASE_CREDENTIALS esté definida y sea un JSON válido
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

// Obtener instancia de Firestore
const db = admin.firestore();

// ========== Endpoints existentes ==========

// Endpoint para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para enviar correo electrónico
app.post('/send-email', upload.single('file'), (req, res) => {
  const { toEmail } = req.body;
  const file = req.file;

  if (!toEmail || !file) {
    return res.status(400).send('Faltan datos');
  }

  // Configurar el transporte de Nodemailer con credenciales desde variables de entorno
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Usuario del correo
      pass: process.env.EMAIL_PASS  // Contraseña del correo
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

// Endpoint para obtener PackRate
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
