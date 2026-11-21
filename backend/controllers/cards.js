// Importa o modelo de cartão para realizar operações no MongoDB
const Card = require('../models/card');

// Constantes com os códigos de status HTTP utilizados nas respostas
const BAD_REQUEST_ERROR_CODE = 400;
const FORBIDDEN_ERROR_CODE = 403;
const NOT_FOUND_ERROR_CODE = 404;
const INTERNAL_SERVER_ERROR_CODE = 500;

// Retorna todos os cartões cadastrados, populando os dados do criador (owner)
const getCards = (req, res) => {
  Card.find({})
    .populate('owner')
    .then((cards) => res.status(200).send(cards))
    .catch(() => res.status(INTERNAL_SERVER_ERROR_CODE).send({
      message: 'Ocorreu um erro no servidor',
    }));
};

// Cria um novo cartão vinculado ao ID do usuário autenticado (req.user._id)
const createCard = (req, res) => {
  // Extrai título e link da imagem enviados no corpo da requisição
  const { name, link } = req.body;
  // Obtém o ID do dono do cartão a partir do objeto de usuário da requisição
  const owner = req.user._id;

  Card.create({ name, link, owner })
    .then((card) => res.status(201).send(card))
    .catch((err) => {
      // Dados inválidos ou faltando conforme o schema de Card -> 400
      if (err.name === 'ValidationError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Dados inválidos fornecidos',
        });
      }
      // Qualquer outro erro inesperado -> 500
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Deleta um cartão específico pelo seu _id, apenas se pertencer ao usuário atual
const deleteCard = (req, res) => {
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
    .catch((err) => {
      // Formato de _id inválido para o ObjectId do MongoDB -> 400
      if (err.name === 'CastError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Id de cartão inválido',
        });
      }
      // Usuário não é dono do cartão -> 403
      if (err.statusCode === FORBIDDEN_ERROR_CODE) {
        return res.status(FORBIDDEN_ERROR_CODE).send({
          message: err.message,
        });
      }
      // Cartão inexistente -> 404
      if (err.statusCode === NOT_FOUND_ERROR_CODE) {
        return res.status(NOT_FOUND_ERROR_CODE).send({
          message: err.message,
        });
      }
      // Erro padrão do servidor -> 500
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Adiciona o _id do usuário ao array likes do cartão sem duplicar
const likeCard = (req, res) => {
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
    .catch((err) => {
      if (err.name === 'CastError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Id de cartão inválido',
        });
      }
      if (err.statusCode === NOT_FOUND_ERROR_CODE) {
        return res.status(NOT_FOUND_ERROR_CODE).send({
          message: err.message,
        });
      }
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Remove o _id do usuário do array likes do cartão
const dislikeCard = (req, res) => {
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
    .catch((err) => {
      if (err.name === 'CastError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Id de cartão inválido',
        });
      }
      if (err.statusCode === NOT_FOUND_ERROR_CODE) {
        return res.status(NOT_FOUND_ERROR_CODE).send({
          message: err.message,
        });
      }
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Exporta todos os controladores de cartões
module.exports = {
  getCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
};
