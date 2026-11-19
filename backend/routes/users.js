// Importa o Router do Express para definir as rotas de usuários
const router = require('express').Router();
// Importa apenas os controladores usados nas rotas sob '/users'
const {
  getUsers,
  getUserById,
  updateProfile,
  updateAvatar,
} = require('../controllers/users');

// GET /users — retorna todos os usuários
router.get('/', getUsers);

// GET /users/:userId — retorna um usuário específico pelo _id
router.get('/:userId', getUserById);

// PATCH /users/me — atualiza nome e descrição do perfil
router.patch('/me', updateProfile);

// PATCH /users/me/avatar — atualiza a URL do avatar do usuário
router.patch('/me/avatar', updateAvatar);

// Exporta o roteador de usuários
module.exports = router;
