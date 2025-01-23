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
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<TU-PROYECTO>.firebaseio.com' // Reemplaza <TU-PROYECTO> con el nombre de tu proyecto
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
      user: 'fabio.gomez@fli.com.co', // Reemplaza con tu correo
      pass: 'lgepmrsgvwqhihsk'         // Reemplaza con tu contraseña o contraseña de aplicación
    }
  });

  let mailOptions = {
    from: process.env.EMAIL_USER, // Asegúrate de definir EMAIL_USER en tu archivo .env
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

// ========== 5. ENDPOINTS PARA FIRESTORE: INVENTARIO ==========

// --- 5.1. Crear o actualizar INVENTARIO ---
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

// --- 6. ENDPOINT PARA FIRESTORE: TOTAL DISPONIBLE ---
app.post('/api/total-disponible', async (req, res) => {
  try {
    console.log('Solicitud POST a /api/total-disponible recibida');
    console.log('Payload:', req.body);

    const { variety, tipoRamo, long, totalEmpaque } = req.body;

    // Validar campos requeridos
    if (!variety || !tipoRamo || !long || totalEmpaque === undefined) {
      console.log('Faltan campos requeridos en la solicitud.');
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    // Validar que totalEmpaque es un número y positivo
    if (isNaN(totalEmpaque)) {
      console.log('totalEmpaque no es un número válido.');
      return res.status(400).json({ error: 'totalEmpaque debe ser un número válido.' });
    }

    if (Number(totalEmpaque) < 0) {
      console.log('totalEmpaque no puede ser negativo.');
      return res.status(400).json({ error: 'totalEmpaque no puede ser negativo.' });
    }

    // Construir el ID del documento basado en variedad, tipoRamo y longitud
    const docId = `${variety.toUpperCase()}_${tipoRamo.toUpperCase()}_${long}`;

    const docRef = db.collection('TotalDisponible').doc(docId);
    const doc = await docRef.get();

    let disponible = 0;
    if (doc.exists) {
      disponible = Number(doc.data().disponible);
      if (isNaN(disponible)) {
        console.log(`Valor de 'disponible' inválido en el documento ${docId}. Reiniciando a 0.`);
        disponible = 0;
      }
      console.log(`Documento existente: ${docId}. Disponible actual: ${disponible}`);
    } else {
      console.log(`Documento no existente: ${docId}. Inicializando disponible a 0.`);
      // Inicializar documento con 'disponible' = 0
      await docRef.set({
        variety,
        tipoRamo,
        long,
        disponible: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Calcular sobrante y actualizar disponible correctamente
    let sobrante = 0;
    if (Number(totalEmpaque) <= Number(disponible)) {
      sobrante = Number(disponible) - Number(totalEmpaque);
      disponible = Number(disponible) - Number(totalEmpaque);
      console.log(`totalEmpaque (${totalEmpaque}) <= disponible (${disponible + Number(totalEmpaque)}). Nuevo Disponible: ${disponible}`);
    } else {
      sobrante = 0;
      disponible = 0;
      console.log(`totalEmpaque (${totalEmpaque}) > disponible (${disponible}). Sobrante: ${sobrante}. Nuevo Disponible: ${disponible}`);
    }

    // Asegurar que sobrante es positivo
    sobrante = Math.max(sobrante, 0);

    console.log(`Sobrante calculado: ${sobrante}`);

    // Actualizar 'disponible' en Firestore
    await docRef.update({
      disponible: disponible,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Disponible para ${docId} actualizado a ${disponible}`);
    console.log(`Enviando respuesta: { sobrante: ${sobrante} }`);
    res.status(200).json({ sobrante });
  } catch (error) {
    console.error('Error al actualizar Total Disponible:', error);
    res.status(500).json({ error: 'Error al actualizar Total Disponible.' });
  }
});



// ========== 7. CONFIGURAR EL PUERTO Y ARRANCAR EL SERVIDOR ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor disponible en http://localhost:${PORT} o en http://<TU-IP-LOCAL>:${PORT}`);
});
