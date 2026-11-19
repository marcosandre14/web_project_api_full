// Importa o Mongoose para definir o esquema e o modelo de usuário
const mongoose = require('mongoose');
// Importa o módulo validator para validar formatos padrão (como e-mail)
const validator = require('validator');

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
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  about: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  // URL do avatar: obrigatória e validada por expressão regular limpa (sem escapes desnecessários)
  avatar: {
    type: String,
    required: true,
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
