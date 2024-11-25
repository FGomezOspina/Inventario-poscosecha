// server.js
//USE EMAILJS PARA ENVIO DE CORREOS
const express = require('express');
const path = require('path');
const app = express();
const nodemailer = require('nodemailer'); // Importamos Nodemailer
const multer = require('multer'); // Importamos Multer para manejar archivos
const upload = multer();
const cors = require('cors'); // Importamos cors para manejar solicitudes desde el frontend

// Configura el puerto
const PORT = process.env.PORT || 3000;

// Habilitamos CORS para todas las solicitudes
app.use(cors());

// Sirve los archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint para enviar el correo electrónico
app.post('/send-email', upload.single('file'), (req, res) => {
    const { toEmail } = req.body;
    const file = req.file;

    if (!toEmail || !file) {
        return res.status(400).send('Faltan datos');
    }

    // Configurar el transporte de Nodemailer
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'fabio.gomez@fli.com.co', // Reemplaza con tu correo
            pass: 'qzvjczsqcapnfeni' // Reemplaza con tu contraseña de aplicación
        }
    });

    let mailOptions = {
        from: 'fabio.gomez@fli.com.co', // Reemplaza con tu correo
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

// Inicia el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor disponible en http://localhost:${PORT} o en http://<TU-IP-LOCAL>:${PORT}`);
});
