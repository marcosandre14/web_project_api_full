// Importa o bcryptjs para criptografar a senha do usuário antes de salvar no banco
const bcrypt = require('bcryptjs');
// Importa o modelo de usuário
const User = require('../models/user');

// Códigos de status HTTP utilizados nas respostas de erro
const BAD_REQUEST_ERROR_CODE = 400;
const CONFLICT_ERROR_CODE = 409;
const INTERNAL_SERVER_ERROR_CODE = 500;

// Retorna todos os usuários
const getUsers = (req, res) => {
  User.find({})
    .then((users) => res.status(200).send(users))
    .catch(() => res.status(INTERNAL_SERVER_ERROR_CODE).send({
      message: 'Ocorreu um erro no servidor',
    }));
};

// Retorna um usuário específico pelo ID
const getUserById = (req, res) => {
  const { userId } = req.params;

  User.findById(userId)
    .orFail(() => {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      throw error;
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'CastError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Id de usuário inválido',
        });
      }
      if (err.statusCode === 404) {
        return res.status(404).send({ message: err.message });
      }
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Cria um novo usuário com senha em hash e sem retornar o campo password
const createUser = (req, res) => {
  // Extrai os campos do corpo da solicitação
  const {
    email, password, name, about, avatar,
  } = req.body;

  // Gera o hash da senha antes de persistir no MongoDB
  return bcrypt
    .hash(password, 10)
    .then((hashedPassword) => User.create({
      email,
      password: hashedPassword,
      name,
      about,
      avatar,
    }))
    .then((user) => {
      // Converte para objeto comum e remove password para não expor o hash na API
      const userObject = user.toObject();
      delete userObject.password;

      return res.status(201).send(userObject);
    })
    .catch((err) => {
      // E-mail já existente no banco (erro de chave única do MongoDB)
      if (err.code === 11000) {
        return res.status(CONFLICT_ERROR_CODE).send({
          message: 'Já existe um usuário cadastrado com este e-mail',
        });
      }

      // Falha de validação do schema (campos inválidos ou ausentes)
      if (err.name === 'ValidationError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Dados inválidos fornecidos',
        });
      }

      // Erro padrão do servidor
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Atualiza o perfil do usuário (name e about)
const updateProfile = (req, res) => {
  const { name, about } = req.body;

  User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    { new: true, runValidators: true },
  )
    .orFail(() => {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      throw error;
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Dados inválidos fornecidos',
        });
      }
      if (err.statusCode === 404) {
        return res.status(404).send({ message: err.message });
      }
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Atualiza o avatar do usuário
const updateAvatar = (req, res) => {
  const { avatar } = req.body;

  User.findByIdAndUpdate(
    req.user._id,
    { avatar },
    { new: true, runValidators: true },
  )
    .orFail(() => {
      const error = new Error('Usuário não encontrado');
      error.statusCode = 404;
      throw error;
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Link de avatar inválido',
        });
      }
      if (err.statusCode === 404) {
        return res.status(404).send({ message: err.message });
      }
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateProfile,
  updateAvatar,
};
