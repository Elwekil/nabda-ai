const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const { pool } = require('./Config/db');
const notificationScheduler = require('./Utils/notificationScheduler');
require('dotenv').config();

const PORT = process.env.PORT || 5001;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    }
});

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    red: "\x1b[31m"
};

const userSockets = new Map();

io.on('connection', (socket) => {
    console.log(`${colors.green}✅ اتصال WebSocket جديد: ${socket.id}${colors.reset}`);

    socket.on('register', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`${colors.cyan}👤 المستخدم ${userId} متصل${colors.reset}`);
    });

    socket.on('medication_reminder', ({ userId, medicationName }) => {
        const recipientSocketId = userSockets.get(userId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('medication_reminder', {
                medicationName,
                message: `حان وقت تناول دواء: ${medicationName}`,
                timestamp: new Date()
            });
        }
    });

    socket.on('appointment_reminder', ({ userId, doctorName, date, time }) => {
        const recipientSocketId = userSockets.get(userId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('appointment_reminder', {
                doctorName,
                date,
                time,
                message: `لديك موعد مع الدكتور ${doctorName} في ${date} الساعة ${time}`,
                timestamp: new Date()
            });
        }
    });

    socket.on('disconnect', () => {
        for (let [userId, socketId] of userSockets.entries()) {
            if (socketId === socket.id) {
                userSockets.delete(userId);
                console.log(`${colors.red}🔴 المستخدم ${userId} غير متصل${colors.reset}`);
                break;
            }
        }
    });
});

notificationScheduler.init(io, userSockets);

const testDatabaseConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`${colors.green}✅ تم الاتصال بقاعدة البيانات بنجاح${colors.reset}`);
        connection.release();
        return true;
    } catch (error) {
        console.error(`${colors.red}❌ فشل الاتصال بقاعدة البيانات:${colors.reset}`, error.message);
        return false;
    }
};

const startServer = async () => {
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.error(`${colors.red}❌ لا يمكن تشغيل الخادم بدون اتصال بقاعدة البيانات${colors.reset}`);
        process.exit(1);
    }

    server.listen(PORT, () => {
        console.log("\n" + "╔" + "═".repeat(58) + "╗");
        console.log("║" + " ".repeat(20) + "🏥 HEALTH SYNC API" + " ".repeat(22) + "║");
        console.log("╠" + "═".repeat(58) + "╣");
        console.log(`║  📌 المنفذ: ${PORT}` + " ".repeat(50 - PORT.toString().length) + "║");
        console.log(`║  🌐 الرابط: http://localhost:${PORT}` + " ".repeat(42 - PORT.toString().length) + "║");
        console.log("╚" + "═".repeat(58) + "╝\n");
    });
};

// Only start server if run directly (not required as a module)
if (require.main === module) {
    startServer();
}

module.exports = app;
