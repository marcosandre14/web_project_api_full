// Importa o Mongoose para definir o esquema e o modelo de cartão
const mongoose = require('mongoose');
// Importa o validator para validar URLs de forma estrita
const validator = require('validator');

// Define a estrutura e as regras de validação de um cartão no MongoDB
const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  link: {
    type: String,
    required: true,
    validate: {
      validator: (v) => validator.isURL(v),
      message: 'Link de imagem inválido',
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      default: [],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Exporta o modelo 'card' vinculado ao cardSchema
module.exports = mongoose.model('card', cardSchema);
