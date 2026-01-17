// client.js
require('dotenv').config();
const { io } = require("socket.io-client");

// CONFIGURACIÓN
// Asegúrate de usar el puerto correcto (3003 es el externo del Catalog Service según tu docker-compose)
const URL = process.env.SOCKET_URL || "http://localhost:3003/ws/catalog";
const TOKEN = process.env.AUTH_TOKEN;

if (!TOKEN) {
    console.error("❌ ERROR: Falta el AUTH_TOKEN en el archivo .env");
    process.exit(1);
}

console.log(`🔌 Conectando a ${URL}...`);

// INICIAR CONEXIÓN
const socket = io(URL, {
    auth: {
        token: TOKEN // Enviamos el JWT aquí
    },
    transports: ['websocket'] // Forzamos websocket para evitar polling
});

// EVENTOS DE CONEXIÓN
socket.on("connect", () => {
    console.log(`✅ CONECTADO con éxito! ID de Socket: ${socket.id}`);

    // === NUEVO: PEDIR SUSCRIPCIÓN ===
    const miListaDePrecios = process.env.LISTA_ID ? Number(process.env.LISTA_ID) : 2;
    console.log(`👉 Solicitando suscripción a lista de precios: ${miListaDePrecios}...`);
    socket.emit('subscribePricelist', { listaId: miListaDePrecios });

    // === NUEVO: Suscribirse como cliente si se indicó CLIENTE_ID en .env ===
    const clienteId = process.env.CLIENTE_ID;
    if (clienteId) {
        console.log(`👉 Solicitando suscripción a cliente: ${clienteId}...`);
        socket.emit('subscribeCliente', { clienteId });
    }

    console.log("👂 Esperando notificaciones...");
});

socket.on("connect_error", (err) => {
    console.error(`❌ Error de conexión: ${err.message}`);
    // A veces el mensaje es un objeto JSON, intentamos mostrarlo
    if (err.data) console.error("Detalle:", err.data);
});

socket.on("disconnect", (reason) => {
    console.log(`⚠️ Desconectado. Razón: ${reason}`);
});

// Confirmación de suscripción
socket.on('subscription-confirmed', (data) => {
    console.log(`🔓 ¡Suscripción confirmada a la sala: ${data.room}!`);
    console.log("👂 Ahora sí, esperando notificaciones de precios...");
});

// ESCUCHAR NOTIFICACIONES (El evento clave)
socket.on("notification", (payload) => {
    console.log("\n🔔 --- NOTIFICACIÓN RECIBIDA --- 🔔");
    console.log("TIPO:", payload.type);
    console.log("TÍTULO:", payload.title);
    console.log("MENSAJE:", payload.message);
    if(payload.data) {
        console.log("DATA:", JSON.stringify(payload.data, null, 2));
    }
    console.log("----------------------------------\n");
});