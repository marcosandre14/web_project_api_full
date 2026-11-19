// Importa o Mongoose para definir o esquema e o modelo de cartão
const mongoose = require('mongoose');

// Define a estrutura dos documentos de cartão no MongoDB
const cardSchema = new mongoose.Schema({
  // Título do cartão
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
  },
  // Link da imagem do cartão com validação de URL sem escapes desnecessários
  link: {
    type: String,
    required: true,
    validate: {
      validator: (v) => /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/.test(
        v,
      ),
      message: 'Link de imagem inválido',
    },
  },
  // Referência ao usuário que criou o cartão
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  // Lista de IDs de usuários que curtiram o cartão
  likes: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
      },
    ],
    default: [],
  },
  // Data de criação do cartão
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Exporta o modelo 'card' vinculado ao cardSchema
module.exports = mongoose.model('card', cardSchema);
