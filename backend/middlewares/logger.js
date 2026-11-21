// Importa módulos nativos do Node.js para manipular caminhos e escrever arquivos de log
const fs = require('fs');
const path = require('path');

// Define o diretório onde os arquivos request.log e error.log serão armazenados
const LOG_DIR = path.join(__dirname, '..', 'logs');
const REQUEST_LOG_PATH = path.join(LOG_DIR, 'request.log');
const ERROR_LOG_PATH = path.join(LOG_DIR, 'error.log');

// Garante que a pasta de logs exista antes de tentar escrever os arquivos
fs.mkdirSync(LOG_DIR, { recursive: true });

// Função auxiliar para anexar um objeto serializado como JSON em uma nova linha
const appendJsonLog = (filePath, payload) => {
  const line = `${JSON.stringify(payload)}\n`;
  fs.appendFile(filePath, line, (writeErr) => {
    if (writeErr) {
      console.error('Falha ao gravar arquivo de log:', writeErr);
    }
  });
};

// Middleware para registrar cada solicitação recebida pela API em formato JSON
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Registra quando a resposta é finalizada para incluir statusCode e duração
  res.on('finish', () => {
    appendJsonLog(REQUEST_LOG_PATH, {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startTime,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
  });

  return next();
};

// Middleware para registrar erros da API em formato JSON antes do tratamento final
const errorLogger = (err, req, res, next) => {
  appendJsonLog(ERROR_LOG_PATH, {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    name: err.name || 'Error',
    message: err.message || 'Ocorreu um erro no servidor',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  return next(err);
};

module.exports = {
  requestLogger,
  errorLogger,
};
