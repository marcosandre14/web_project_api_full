// Importa o Router do Express para definir as rotas de usuários
const router = require('express').Router();
// Importa celebrate e Joi para validação de parâmetros e corpos de requisição
const { celebrate, Joi } = require('celebrate');
// Importa validadores personalizados (URL com validator.isURL e ID MongoDB)
const { validateURL, objectIdValidator } = require('../middlewares/validators');
// Importa os controladores usados nas rotas sob '/users'
const {
  getUsers,
  getUserById,
  getCurrentUser,
  updateProfile,
  updateAvatar,
} = require('../controllers/users');

// GET /users — retorna todos os usuários
router.get('/', getUsers);

// GET /users/me — retorna os dados do usuário autenticado atual (antes de '/:userId')
router.get('/me', getCurrentUser);

// GET /users/:userId — valida userId nos parâmetros e retorna o usuário
router.get(
  '/:userId',
  celebrate({
    params: Joi.object().keys({
      userId: objectIdValidator,
    }),
  }),
  getUserById,
);

// PATCH /users/me — valida name e about no corpo da requisição
router.patch(
  '/me',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      about: Joi.string().required().min(2).max(30),
    }),
  }),
  updateProfile,
);

// PATCH /users/me/avatar — valida avatar com validator.isURL no corpo da requisição
router.patch(
  '/me/avatar',
  celebrate({
    body: Joi.object().keys({
      avatar: Joi.string().required().custom(validateURL),
    }),
  }),
  updateAvatar,
);

// Exporta o roteador de usuários
module.exports = router;
