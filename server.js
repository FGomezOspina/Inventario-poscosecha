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
// app.js o index.js (el archivo principal de tu servidor)
const cron = require('node-cron');
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

/**
 * Endpoint para actualizar Total Disponible y obtener Bunches Total.
 * Recibe: { variety, tipoRamo, long, totalEmpaque }
 * Retorna: { sobrante, bunchesTotal }
 */
app.post('/api/total-disponible', async (req, res) => {
  try {
    const { variety, tipoRamo, long, totalEmpaque } = req.body;

    // 1. Validaciones básicas
    if (!variety || !tipoRamo || !long || totalEmpaque === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }
    if (isNaN(totalEmpaque)) {
      return res.status(400).json({ error: 'totalEmpaque debe ser un número.' });
    }

    // 2. IDs y referencias
    const docId = `${variety.toUpperCase()}_${tipoRamo.toUpperCase()}_${long}`;
    const totalDisponibleRef = db.collection('totalDisponible').doc(docId);
    const inventarioRef = db.collection('inventario').doc(docId);

    // 3. Leer documentos en paralelo
    const [totalDisponibleDoc, inventarioDoc] = await Promise.all([
      totalDisponibleRef.get(),
      inventarioRef.get()
    ]);

    // 4. Verificar que exista en inventario
    if (!inventarioDoc.exists) {
      return res.status(400).json({ error: 'Documento no existe en inventario.' });
    }

    const inventarioData = inventarioDoc.data();
    // Validar consistencia con inventario
    if (
      inventarioData.variety.toUpperCase() !== variety.toUpperCase() ||
      inventarioData.tipoRamo.toUpperCase() !== tipoRamo.toUpperCase() ||
      inventarioData.long !== long
    ) {
      return res.status(400).json({ error: 'Inconsistencia entre inventario y totalDisponible.' });
    }

    // 5. Obtenemos disponible_ayer y disponible_hoy actuales (o los creamos en 0)
    let disponibleAyer = 0;
    let disponibleHoy = 0;

    if (totalDisponibleDoc.exists) {
      const data = totalDisponibleDoc.data();
      disponibleAyer = Number(data.disponible_ayer) || 0;
      disponibleHoy  = Number(data.disponible_hoy)  || 0;
    } else {
      // Si no existe el doc, lo creamos con ambos campos en 0
      await totalDisponibleRef.set({
        variety,
        tipoRamo,
        long,
        disponible_ayer: 0,
        disponible_hoy:  0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 6. Calcular sobrante
    //    sobrante = disponible_ayer - totalEmpaque (forzando a 0 si es negativo)
    let sobrante = disponibleAyer - Number(totalEmpaque);
    if (sobrante < 0) sobrante = 0;

    // 7. bunchesTotal del inventario
    let bunchesTotal = Number(inventarioData.bunchesTotal) || 0;

    // 8. El "nuevo disponible hoy" es la suma de (sobrante + bunchesTotal)
    const nuevoDisponibleHoy = sobrante + bunchesTotal;

    // 9. Actualizar en Firestore
    //    - disponible_ayer se mantiene
    //    - disponible_hoy se actualiza
    await totalDisponibleRef.update({
      disponible_ayer: disponibleAyer,
      disponible_hoy:  nuevoDisponibleHoy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 10. Responder al frontend
    return res.status(200).json({
      sobrante,          // ejemplo: 4
      bunchesTotal,      // ejemplo: 16
      disponibleAyer,    // ejemplo: 30
      disponibleHoy: nuevoDisponibleHoy // ejemplo: 20
    });

  } catch (error) {
    console.error('Error al actualizar Total Disponible:', error);
    return res.status(500).json({ error: 'Error al actualizar Total Disponible.' });
  }
});


async function resetDisponiblesDiario() {
  console.log('Inicio de resetDisponiblesDiario()...');
  
  const snapshot = await db.collection('totalDisponible').get();
  const batch = db.batch();
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    const disponibleHoy = data.disponible_hoy || 0;
    batch.update(doc.ref, {
      disponible_ayer: disponibleHoy,
      disponible_hoy:  0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // Este console.log es extra, para ver ID y valores en la consola
    console.log(`Documento ${doc.id}: disponible_ayer se setea a ${disponibleHoy}, y disponible_hoy a 0`);
  });
  
  await batch.commit();
  console.log('Reset diario completado satisfactoriamente.');
}

// Para pruebas, se ejecuta CADA MINUTO => '* * * * *'
// (Nota: En producción, regrésalo a '1 0 * * *' o la hora que desees).
cron.schedule('1 0 * * *', async () => {
  try {
    console.log('Ejecutando reset de prueba cada minuto...');
    await resetDisponiblesDiario();
  } catch (error) {
    console.error('Error en el reset:', error);
  }
});


// ========== 7. CONFIGURAR EL PUERTO Y ARRANCAR EL SERVIDOR ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor disponible en http://localhost:${PORT} o en http://<TU-IP-LOCAL>:${PORT}`);
});
