// Carrega variáveis de ambiente do arquivo .env (em desenvolvimento, ignora se não existir)
require('dotenv').config();

// Importa o framework Express para gerenciar a aplicação HTTP
const express = require('express');
// Importa o Mongoose para conectar e interagir com o MongoDB
const mongoose = require('mongoose');
// Importa o middleware oficial de CORS para habilitar requisições cross-origin
const cors = require('cors');
// Importa celebrate e Joi para validar entradas nas rotas de autenticação e cabeçalhos
const { celebrate, Joi } = require('celebrate');
// Importa validador customizado de URL baseado em validator.isURL
const { validateURL } = require('./middlewares/validators');
// Importa os middlewares de registro de solicitações e erros em JSON
const { requestLogger, errorLogger } = require('./middlewares/logger');

// Importa os controladores de autenticação e registro de usuários
const { login, createUser } = require('./controllers/users');
// Importa o middleware de autorização baseado em JWT
const auth = require('./middlewares/auth');
// Importa o middleware centralizado de tratamento de erros
const errorHandler = require('./middlewares/errorHandler');
// Importa os módulos de roteamento criados na pasta /routes
const usersRouter = require('./routes/users');
const cardsRouter = require('./routes/cards');

// Cria uma instância da aplicação Express
const app = express();
// Define a porta de execução a partir do ambiente ou usa 3000 como padrão
const { PORT = 3000 } = process.env;

// Lista de origens autorizadas a consumir a API pelo navegador
const allowedCors = [
  'https://marcos-around.duckdns.org',
  'http://marcos-around.duckdns.org',
  'http://localhost:3000',
  'http://localhost:3001',
];

// Opções de configuração do middleware CORS
const corsOptions = {
  origin: allowedCors,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Conecta ao servidor MongoDB local e ao banco 'aroundb'
mongoose
  .connect('mongodb://localhost:27017/aroundb')
  .then(() => {
    console.log('Conectado ao MongoDB');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
  });

// Middleware para analisar corpos de requisição em formato JSON
app.use(express.json());

// Registra cada solicitação recebida pela API em request.log (formato JSON)
app.use(requestLogger);

// Habilita CORS para todas as rotas antes da definição dos endpoints
app.use(cors(corsOptions));

// ============================================================================
// Gera um erro não tratado de forma assíncrona para testar a recuperação
// automática do processo pelo PM2.
// ============================================================================

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('O servidor travará agora');
  }, 0);
});

// ============================================================================

// Rotas públicas: não exigem token JWT, mas validam o corpo da requisição
app.post(
  '/signin',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
    }),
  }),
  login,
);

app.post(
  '/signup',
  celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().required(),
      name: Joi.string().min(2).max(30),
      about: Joi.string().min(2).max(30),
      avatar: Joi.string().custom(validateURL),
    }),
  }),
  createUser,
);

// Middleware de autorização JWT: protege todas as rotas definidas abaixo
app.use(auth);

// Valida a presença do cabeçalho authorization nas rotas protegidas
app.use(
  celebrate({
    headers: Joi.object()
      .keys({
        authorization: Joi.string().required(),
      })
      .unknown(true),
  }),
);

// Rotas protegidas de usuários e cartões
app.use('/users', usersRouter);
app.use('/cards', cardsRouter);

// Middleware para capturar requisições em rotas inexistentes (Erro 404)
app.use((req, res, next) => {
  const notFoundError = new Error('Recurso requisitado não encontrado');
  notFoundError.statusCode = 404;
  next(notFoundError);
});

// Registra os erros em error.log (formato JSON) antes do tratamento final
app.use(errorLogger);

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

// Inicia o servidor e o coloca escutando na porta especificada
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
