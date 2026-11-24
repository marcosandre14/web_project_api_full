// Importa o Router do Express para definir as rotas de cartões
const router = require('express').Router();
// Importa celebrate e Joi para validação de parâmetros e corpos de requisição
const { celebrate, Joi } = require('celebrate');
// Importa validadores personalizados (URL com validator.isURL e ID MongoDB)
const { validateURL, objectIdValidator } = require('../middlewares/validators');
// Importa os controladores usados nas rotas sob '/cards'
const {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
} = require('../controllers/cards');

// GET /cards — retorna todos os cartões
router.get('/', getCards);

// POST /cards — valida name e link no corpo da requisição e cria um novo cartão
router.post(
  '/',
  celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      link: Joi.string().required().custom(validateURL),
    }),
  }),
  createCard,
);

// DELETE /cards/:cardId — valida cardId nos parâmetros e deleta o cartão por _id
router.delete(
  '/:cardId',
  celebrate({
    params: Joi.object().keys({
      cardId: objectIdValidator,
    }),
  }),
  deleteCard,
);

// PUT /cards/:cardId/likes — valida cardId nos parâmetros e adiciona curtida
router.put(
  '/:cardId/likes',
  celebrate({
    params: Joi.object().keys({
      cardId: objectIdValidator,
    }),
  }),
  likeCard,
);

// DELETE /cards/:cardId/likes — valida cardId nos parâmetros e remove curtida
router.delete(
  '/:cardId/likes',
  celebrate({
    params: Joi.object().keys({
      cardId: objectIdValidator,
    }),
  }),
  dislikeCard,
);

// Exporta o roteador de cartões
module.exports = router;
