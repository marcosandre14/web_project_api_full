// Importa o Joi diretamente do pacote celebrate para evitar incompatibilidade de versões
const { Joi } = require('celebrate');
// Importa validator para validação estrita de URLs
const validator = require('validator');

// Valida URL usando validator.isURL e retorna erro padrão 'string.uri' do Joi se inválido
const validateURL = (value, helpers) => {
  if (validator.isURL(value)) {
    return value;
  }
  return helpers.error('string.uri');
};

// Validador padrão para IDs de documentos MongoDB (24 caracteres hexadecimais)
const objectIdValidator = Joi.string().hex().length(24).required();

module.exports = {
  validateURL,
  objectIdValidator,
};
