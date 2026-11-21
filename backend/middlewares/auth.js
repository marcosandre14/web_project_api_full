// Importa o jsonwebtoken para verificar a assinatura e a validade do JWT
const jwt = require('jsonwebtoken');

// Código de status HTTP 401 (Não autorizado) quando há falha na autenticação do token
const UNAUTHORIZED_ERROR_CODE = 401;

// Segredo JWT: variável de ambiente em produção ou fallback em desenvolvimento
const JWT_SECRET = process.env.NODE_ENV === 'production'
  ? process.env.JWT_SECRET
  : 'dev-secret-key';

// Cria um erro padronizado de não autorizado (401)
const createUnauthorizedError = () => {
  const error = new Error('Autorização necessária');
  error.statusCode = UNAUTHORIZED_ERROR_CODE;
  return error;
};

// Middleware de autorização que verifica o JWT enviado no cabeçalho da requisição
const auth = (req, res, next) => {
  // Obtém o cabeçalho de autorização da requisição
  const { authorization } = req.headers;

  // Verifica se o cabeçalho existe e segue o padrão "Bearer <token>"
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(createUnauthorizedError());
  }

  // Extrai apenas o token JWT removendo o prefixo "Bearer "
  const token = authorization.replace('Bearer ', '').trim();

  // Se após remover "Bearer " o token estiver vazio, encaminha erro 401
  if (!token) {
    return next(createUnauthorizedError());
  }

  let payload;

  try {
    // Valida o token e decodifica seu payload (ex.: { _id, iat, exp })
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // Token inválido, malformado ou expirado -> encaminha erro 401
    return next(createUnauthorizedError());
  }

  // Anexa o payload decodificado à requisição e passa o controle adiante
  req.user = payload;
  return next();
};

// Exporta o middleware de autorização
module.exports = auth;
