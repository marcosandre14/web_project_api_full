// Importa a função oficial para identificar erros lançados pelo celebrate
const { isCelebrateError } = require('celebrate');

// Constantes de códigos de status HTTP
const BAD_REQUEST_ERROR_CODE = 400;
const CONFLICT_ERROR_CODE = 409;
const INTERNAL_SERVER_ERROR_CODE = 500;

// Middleware centralizado de tratamento de erros (4 argumentos para o Express reconhecer)
const errorHandler = (err, req, res, next) => {
  // Erros de validação de entrada gerados pelo celebrate/Joi -> 400
  if (isCelebrateError(err)) {
    // Extrai a primeira mensagem dos segmentos validados (body, params, headers)
    const firstError = [...err.details.values()][0];
    const message = firstError
      ? firstError.message
      : 'Dados inválidos fornecidos';

    return res.status(BAD_REQUEST_ERROR_CODE).send({
      message,
    });
  }

  // Erro de chave duplicada no MongoDB (ex.: e-mail já cadastrado) -> 409
  if (err.code === 11000) {
    return res.status(CONFLICT_ERROR_CODE).send({
      message: 'Já existe um registro com estes dados',
    });
  }

  // Erros de validação ou ID inválido (CastError) do Mongoose -> 400
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(BAD_REQUEST_ERROR_CODE).send({
      message: 'Dados inválidos fornecidos',
    });
  }

  // Erros previstos com statusCode explícito (400, 401, 403, 404 etc.)
  if (err.statusCode) {
    return res.status(err.statusCode).send({
      message: err.message,
    });
  }

  // Qualquer erro imprevisto -> 500 com mensagem genérica
  return res.status(INTERNAL_SERVER_ERROR_CODE).send({
    message: 'Ocorreu um erro no servidor',
  });
};

module.exports = errorHandler;
