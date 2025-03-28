// server.js

// ========== 1. IMPORTS AND INITIAL CONFIGURATION ==========
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer();

// Basic configuration
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== 2. INITIALIZE FIREBASE ADMIN ==========
const cron = require('node-cron');
const admin = require('firebase-admin');

// Verify environment variable with Firebase credentials
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

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  
});

const db = admin.firestore();

// ========== 3. MAIN ENDPOINTS (INVENTORY, PACKRATE, ETC.) ==========

// --- 3.1. main Endpoint ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 3.2. Endpoint to send email (with file) ---
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

// ========== 4. ENDPOINTS for FIRESTORE: PACKRATE ==========

// --- 4.1. Create or update PACKRATE ---
app.post('/api/packrate', async (req, res) => {
  try {
    const packRateData = req.body;
    packRateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    if (packRateData.groupId) {
      // Update existing document
      await db.collection('packrate').doc(packRateData.groupId).set(packRateData, { merge: true });
      res.status(200).json({ message: "Documento actualizado" });
    } else {
      // Create new document
      packRateData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      const docRef = await db.collection('packrate').add(packRateData);
      res.status(200).json({ id: docRef.id });
    }
  } catch (error) {
    console.error('Error al guardar PackRate:', error);
    res.status(500).json({ error: 'Error al guardar PackRate' });
  }
});

// --- 4.2. Get all PACKRATE ---
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

// ========== 5. ENDPOINTS for FIRESTORE: INVENTORY ==========

// --- 5.1. Create o update INVENTORY ---
app.post('/api/inventario', async (req, res) => {
  try {
    const { variety, tipoRamo, long, bunchesTotal } = req.body;

    if (!variety || !tipoRamo || !long) {
      return res.status(400).json({ error: 'Faltan campos (variety, tipoRamo, long)' });
    }

    // We build an ID based on variety, typeRamo and long
    const docId = `${variety.toUpperCase()}_${tipoRamo.toUpperCase()}_${long}`;

    // We make the set with merge: true
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
 * Endpoint to update Total Available and get Total Bunches.
 * Receives: { variety, typeBunch, long, totalPackage }
 * Returns: { remaining, bunchesTotal }
 */
app.post('/api/total-disponible', async (req, res) => {
  try {
    const { variety, tipoRamo, long, totalEmpaque } = req.body;

    // 1. Basic validations
    if (!variety || !tipoRamo || !long || totalEmpaque === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }
    if (isNaN(totalEmpaque)) {
      return res.status(400).json({ error: 'totalEmpaque debe ser un número.' });
    }

    // 2. IDs y referencys
    const docId = `${variety.toUpperCase()}_${tipoRamo.toUpperCase()}_${long}`;
    const totalDisponibleRef = db.collection('totalDisponible').doc(docId);
    const inventarioRef = db.collection('inventario').doc(docId);

    // 3. Read documents in parallel
    const [totalDisponibleDoc, inventarioDoc] = await Promise.all([
      totalDisponibleRef.get(),
      inventarioRef.get()
    ]);

    // 4. Verify that inventory exists
    if (!inventarioDoc.exists) {
      return res.status(400).json({ error: 'Documento no existe en inventario.' });
    }

    const inventarioData = inventarioDoc.data();
    // Validate consistency with inventory
    if (
      inventarioData.variety.toUpperCase() !== variety.toUpperCase() ||
      inventarioData.tipoRamo.toUpperCase() !== tipoRamo.toUpperCase() ||
      inventarioData.long !== long
    ) {
      return res.status(400).json({ error: 'Inconsistencia entre inventario y totalDisponible.' });
    }

    // 5. We obtain current available_day and available_today (or create them at 0)
    let disponibleAyer = 0;
    let disponibleHoy = 0;

    if (totalDisponibleDoc.exists) {
      const data = totalDisponibleDoc.data();
      disponibleAyer = Number(data.disponible_ayer) || 0;
      disponibleHoy  = Number(data.disponible_hoy)  || 0;
    } else {
      // If the doc does not exist, we create it with both fields in 0
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

    // 6. Calculate remaining
    // remaining = available_ayer - totalPackage (forcing to 0 if negative)
    let sobrante = disponibleAyer - Number(totalEmpaque);
    if (sobrante < 0) sobrante = 0;

    // 7. bunchesTotal of inventory
    let bunchesTotal = Number(inventarioData.bunchesTotal) || 0;

    // 8. The “new available today” is the sum of (leftover + bunchesTotal)
    const nuevoDisponibleHoy = sobrante + bunchesTotal;

    // 9. Update in Firestore
    // - available_yesterday is maintained
    // - available_today is updated
    await totalDisponibleRef.update({
      disponible_ayer: disponibleAyer,
      disponible_hoy:  nuevoDisponibleHoy,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 10. Rrespond to the frontend
    return res.status(200).json({
      sobrante,          
      bunchesTotal,     
      disponibleAyer,    
      disponibleHoy: nuevoDisponibleHoy 
    });

  } catch (error) {
    console.error('Error al actualizar Total Disponible:', error);
    return res.status(500).json({ error: 'Error al actualizar Total Disponible.' });
  }
});


async function resetDisponiblesDiario() {
  console.log('Inicio de resetDisponiblesDiario()...');
  
  try {
    const snapshot = await db.collection('totalDisponible').get();
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const disponibleHoy = data.disponible_hoy || 0;

      batch.update(doc.ref, {
        disponible_ayer: disponibleHoy,
        disponible_hoy: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Documento ${doc.id}: disponible_ayer = ${disponibleHoy}, disponible_hoy = 0`);
    });

    await batch.commit();
    console.log('Reset diario completado satisfactoriamente.');
    return { status: "ok", message: "Reset diario ejecutado con éxito" };
  } catch (error) {
    console.error('Error en resetDisponiblesDiario:', error);
    return { status: "error", message: "Error al ejecutar el reset diario" };
  }
}

// Endpoint para llamar manualmente desde cron-job.org
app.get('/resetDisponiblesDiario', async (req, res) => {
  const result = await resetDisponiblesDiario();
  res.status(result.status === "ok" ? 200 : 500).json(result);

  //console.log("🚀 Función de prueba ejecutada correctamente.");
  //res.status(200).json({ status: "ok", message: "Reset diario ejecutado con éxito (prueba)" });
});

// ======= NUEVOS ENDPOINTS PARA CONFIGURACIONES =======

// Obtener todas las configuraciones de categorías.
app.get('/api/config', async (req, res) => {
  try {
    const snapshot = await db.collection('configurations').get();
    const configList = {};
    snapshot.forEach(doc => {
      configList[doc.id] = doc.data();
    });
    res.status(200).json(configList);
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    res.status(500).json({ error: 'Error al obtener la configuración' });
  }
});

// Crear o actualizar la configuración de una categoría.
app.post('/api/config', async (req, res) => {
  try {
    const { category, configData } = req.body;
    if (!category || !configData) {
      return res.status(400).json({ error: 'Faltan datos (category o configData)' });
    }
    configData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    const configRef = db.collection('configurations').doc(category.toUpperCase());
    const doc = await configRef.get();
    if (doc.exists) {
      await configRef.set(configData, { merge: true });
      res.status(200).json({ message: 'Updated configuration' });
    } else {
      configData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      await configRef.set(configData);
      res.status(200).json({ message: 'Category created' });
    }
  } catch (error) {
    console.error('Error al guardar la configuración:', error);
    res.status(500).json({ error: 'Error al guardar la configuración' });
  }
});

// Eliminar categoría y sus configuraciones
app.delete('/api/config/:category', async (req, res) => {
  const { category } = req.params;

  try {
    // Eliminamos la categoría y sus configuraciones
    const configRef = db.collection('configurations').doc(category.toUpperCase());
    const doc = await configRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Eliminamos la categoría
    await configRef.delete();
    // Eliminar otras configuraciones relacionadas con esta categoría si es necesario (por ejemplo, packrate, inventario, etc.)
    // Esto puede ser necesario si existen colecciones asociadas con la categoría que quieras eliminar

    // Si es necesario eliminar otros documentos, puedes hacer lo siguiente:
    // await db.collection('packrate').where('category', '==', category).get().then(snapshot => {
    //   snapshot.forEach(doc => doc.ref.delete());
    // });

    res.status(200).json({ message: `Category ${category} deleted sucessfully.` });
  } catch (error) {
    console.error('Error al eliminar la categoría:', error);
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
});

// Eliminar un Bunche Type globalmente para todas las categorías
app.delete('/api/bunche-type/:buncheType', async (req, res) => {
  const { buncheType } = req.params;

  try {
      // Obtenemos todas las categorías de la colección 'configurations'
      const snapshot = await db.collection('configurations').get();
      
      // Iniciamos una transacción para asegurar que los cambios se apliquen de manera atómica
      const batch = db.batch();
      
      snapshot.forEach(doc => {
          const categoryRef = db.collection('configurations').doc(doc.id);

          // Verificamos si el Bunche Type existe en esta categoría
          const categoryData = doc.data();
          if (categoryData[buncheType]) {
              // Si existe, lo eliminamos
              batch.update(categoryRef, {
                  [buncheType]: admin.firestore.FieldValue.delete()
              });
          }
      });

      // Ejecutamos el batch (todos los cambios se aplican al mismo tiempo)
      await batch.commit();
      
      res.status(200).json({ message: `El Bunche type '${buncheType}' ha sido eliminado globalmente de todas las categorías.` });
  } catch (error) {
      console.error('Error al eliminar Bunche Type globalmente:', error);
      res.status(500).json({ error: 'Error al eliminar el Bunche Type globalmente' });
  }
});




// ========== 7. CONFIGURE THE PORT AND START THE SERVER ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor disponible en http://localhost:${PORT} o en http://<TU-IP-LOCAL>:${PORT}`);
});
