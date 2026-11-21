const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const { validateURL, objectIdValidator } = require('../middlewares/validators');
const {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
} = require('../controllers/cards');

// GET /cards — retorna todos os cartões
router.get('/', getCards);

// POST /cards — valida name e link (com validator.isURL) no corpo da requisição
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

// DELETE /cards/:cardId — valida cardId nos parâmetros antes de deletar
router.delete(
  '/:cardId',
  celebrate({
    params: Joi.object().keys({
      cardId: objectIdValidator,
    }),
  }),
  deleteCard,
);

// PUT /cards/:cardId/likes — valida cardId nos parâmetros antes de curtir
router.put(
  '/:cardId/likes',
  celebrate({
    params: Joi.object().keys({
      cardId: objectIdValidator,
    }),
  }),
  likeCard,
);

// DELETE /cards/:cardId/likes — valida cardId nos parâmetros antes de remover curtida
router.delete(
  '/:cardId/likes',
  celebrate({
    params: Joi.object().keys({
      cardId: objectIdValidator,
    }),
  }),
  dislikeCard,
);

module.exports = router;
