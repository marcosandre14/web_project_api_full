// Importa o modelo de cartão para realizar operações no MongoDB
const Card = require('../models/card');

// Constantes com os códigos de status HTTP utilizados em erros de domínio
const FORBIDDEN_ERROR_CODE = 403;
const NOT_FOUND_ERROR_CODE = 404;

// Retorna todos os cartões cadastrados, populando os dados do criador (owner)
const getCards = (req, res, next) => {
  Card.find({})
    .populate('owner')
    .then((cards) => res.status(200).send(cards))
    .catch(next);
};

// Cria um novo cartão vinculado ao ID do usuário autenticado (req.user._id)
const createCard = (req, res, next) => {
  // Extrai título e link da imagem enviados no corpo da requisição
  const { name, link } = req.body;
  // Obtém o ID do dono do cartão a partir do objeto de usuário da requisição
  const owner = req.user._id;

  Card.create({ name, link, owner })
    .then((card) => res.status(201).send(card))
    .catch(next);
};

// Deleta um cartão específico pelo seu _id, apenas se pertencer ao usuário atual
const deleteCard = (req, res, next) => {
  const { cardId } = req.params;

  Card.findById(cardId)
    .orFail(() => {
      // Dispara erro 404 caso nenhum cartão seja encontrado com o cardId informado
      const error = new Error('Cartão não encontrado');
      error.statusCode = NOT_FOUND_ERROR_CODE;
      throw error;
    })
    .then((card) => {
      // Verifica se o usuário autenticado é o proprietário do cartão
      if (String(card.owner) !== String(req.user._id)) {
        const error = new Error(
          'Você não tem permissão para excluir este cartão',
        );
        error.statusCode = FORBIDDEN_ERROR_CODE;
        throw error;
      }

      // Se for o proprietário, exclui o cartão do banco e retorna 200
      return Card.findByIdAndDelete(cardId).then((deletedCard) => res.status(200).send({
        message: 'Cartão deletado com sucesso',
        card: deletedCard,
      }));
    })
    .catch(next);
};

// Adiciona o _id do usuário ao array likes do cartão sem duplicar
const likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } },
    { new: true },
  )
    .orFail(() => {
      const error = new Error('Cartão não encontrado');
      error.statusCode = NOT_FOUND_ERROR_CODE;
      throw error;
    })
    .then((card) => res.status(200).send(card))
    .catch(next);
};

// Remove o _id do usuário do array likes do cartão
const dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } },
    { new: true },
  )
    .orFail(() => {
      const error = new Error('Cartão não encontrado');
      error.statusCode = NOT_FOUND_ERROR_CODE;
      throw error;
    })
    .then((card) => res.status(200).send(card))
    .catch(next);
};

// Exporta todos os controladores de cartões
module.exports = {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};
