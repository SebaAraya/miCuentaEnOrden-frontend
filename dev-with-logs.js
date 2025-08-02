const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Archivo de log
const logFile = path.join(logsDir, 'backend.log');

console.log('🚀 Iniciando MiCuentaEnOrden Backend con logging...');
console.log(`📁 Logs guardados en: ${logFile}`);
console.log('📊 Para ver logs en tiempo real: tail -f backend/logs/backend.log');
console.log('─'.repeat(80));

// Iniciar el proceso
const child = spawn('npm', ['run', 'dev'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: __dirname
});

// Crear stream de escritura para el archivo de log
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Función para escribir con timestamp
function writeWithTimestamp(data, isError = false) {
    const timestamp = new Date().toISOString();
    const prefix = isError ? '❌ ERROR' : '📝 INFO';
    const message = `[${timestamp}] ${prefix}: ${data}`;

    // Escribir a consola
    console.log(message);

    // Escribir a archivo
    logStream.write(message + '\n');
}

// Capturar stdout
child.stdout.on('data', (data) => {
    writeWithTimestamp(data.toString().trim());
});

// Capturar stderr
child.stderr.on('data', (data) => {
    writeWithTimestamp(data.toString().trim(), true);
});

// Manejar cierre del proceso
child.on('close', (code) => {
    const message = `Backend process exited with code ${code}`;
    writeWithTimestamp(message);
    logStream.end();
});

// Manejar señales del sistema
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando backend...');
    child.kill('SIGINT');
    logStream.end();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando backend...');
    child.kill('SIGTERM');
    logStream.end();
    process.exit(0);
}); 