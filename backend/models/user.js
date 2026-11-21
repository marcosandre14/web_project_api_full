// Importa o Mongoose para definir o esquema e o modelo de usuário
const mongoose = require('mongoose');
// Importa o módulo validator para validar formatos padrão (como e-mail)
const validator = require('validator');

// URL padrão de avatar usada quando o usuário se cadastra sem informar foto
const DEFAULT_AVATAR_URL = 'https://practicum-content.s3.us-west-1.amazonaws.com/software-engineer/around-project/avatar.jpg';

// Define a estrutura e as regras de validação de um documento de usuário no MongoDB
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (value) => validator.isEmail(value),
      message: 'Endereço de e-mail inválido',
    },
  },
  // select: false impede que o hash seja retornado por padrão nas consultas
  password: {
    type: String,
    required: true,
    select: false,
  },
  name: {
    type: String,
    required: true,
    default: 'Jacques Cousteau',
    minlength: 2,
    maxlength: 30,
  },
  about: {
    type: String,
    required: true,
    default: 'Explorer',
    minlength: 2,
    maxlength: 30,
  },
  // URL do avatar: obrigatória com valor padrão e validada por expressão regular
  avatar: {
    type: String,
    required: true,
    default: DEFAULT_AVATAR_URL,
    validate: {
      validator: (v) => /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/.test(
        v,
      ),
      message: 'Link de avatar inválido',
    },
  },
});

// Exporta o modelo 'user' vinculado ao userSchema
module.exports = mongoose.model('user', userSchema);
