// Importa o bcryptjs para gerar hash e comparar senhas de forma segura
const bcrypt = require('bcryptjs');
// Importa o jsonwebtoken para criar o token JWT de autenticação
const jwt = require('jsonwebtoken');
// Importa o modelo de usuário
const User = require('../models/user');

// Códigos de status HTTP utilizados nas respostas
const BAD_REQUEST_ERROR_CODE = 400;
const UNAUTHORIZED_ERROR_CODE = 401;
const NOT_FOUND_ERROR_CODE = 404;
const CONFLICT_ERROR_CODE = 409;
const INTERNAL_SERVER_ERROR_CODE = 500;

// Chave secreta do JWT: usa variável de ambiente ou fallback em modo de desenvolvimento
const JWT_SECRET = process.env.NODE_ENV === 'production'
  ? process.env.JWT_SECRET
  : 'dev-secret-key';

// Retorna todos os usuários
const getUsers = (req, res) => {
  User.find({})
    .then((users) => res.status(200).send(users))
    .catch(() => res.status(INTERNAL_SERVER_ERROR_CODE).send({
      message: 'Ocorreu um erro no servidor',
    }));
};

// Retorna um usuário específico pelo ID informado na rota
const getUserById = (req, res) => {
  const { userId } = req.params;

  User.findById(userId)
    .orFail(() => {
      const error = new Error('Usuário não encontrado');
      error.statusCode = NOT_FOUND_ERROR_CODE;
      throw error;
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'CastError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Id de usuário inválido',
        });
      }
      if (err.statusCode === NOT_FOUND_ERROR_CODE) {
        return res.status(NOT_FOUND_ERROR_CODE).send({ message: err.message });
      }
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Retorna os dados do usuário atualmente autenticado (via req.user._id)
const getCurrentUser = (req, res) => {
  // Busca o usuário pelo _id armazenado no payload do JWT e exclui o campo password
  User.findById(req.user._id)
    .select('-password')
    .orFail(() => {
      const error = new Error('Usuário não encontrado');
      error.statusCode = NOT_FOUND_ERROR_CODE;
      throw error;
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'CastError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Id de usuário inválido',
        });
      }
      if (err.statusCode === NOT_FOUND_ERROR_CODE) {
        return res.status(NOT_FOUND_ERROR_CODE).send({ message: err.message });
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
      // E-mail já existente no banco (erro de chave única do MongoDB) -> 409
      if (err.code === 11000) {
        return res.status(CONFLICT_ERROR_CODE).send({
          message: 'Já existe um usuário cadastrado com este e-mail',
        });
      }

      // Falha de validação do schema (campos inválidos ou ausentes) -> 400
      if (err.name === 'ValidationError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Dados inválidos fornecidos',
        });
      }

      // Erro padrão do servidor -> 500
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Autentica o usuário por e-mail e senha e retorna um JWT válido por 7 dias
const login = (req, res) => {
  // Obtém e-mail e senha enviados no corpo da solicitação
  const { email, password } = req.body;

  // Se faltar e-mail ou senha, retorna erro 401
  if (!email || !password) {
    return res.status(UNAUTHORIZED_ERROR_CODE).send({
      message: 'E-mail ou senha incorretos',
    });
  }

  // Busca o usuário pelo e-mail incluindo explicitamente o campo password (select: false)
  return User.findOne({ email })
    .select('+password')
    .then((user) => {
      // Se não encontrar usuário com esse e-mail, retorna 401
      if (!user) {
        const error = new Error('E-mail ou senha incorretos');
        error.statusCode = UNAUTHORIZED_ERROR_CODE;
        throw error;
      }

      // Compara a senha enviada com o hash salvo no banco
      return bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          const error = new Error('E-mail ou senha incorretos');
          error.statusCode = UNAUTHORIZED_ERROR_CODE;
          throw error;
        }

        // Cria o JWT contendo apenas { _id } no payload e expiração de 7 dias
        const token = jwt.sign({ _id: user._id }, JWT_SECRET, {
          expiresIn: '7d',
        });

        // Envia o token gerado no corpo da resposta
        return res.status(200).send({ token });
      });
    })
    .catch((err) => {
      // Credenciais inválidas -> 401
      if (err.statusCode === UNAUTHORIZED_ERROR_CODE) {
        return res.status(UNAUTHORIZED_ERROR_CODE).send({
          message: err.message,
        });
      }

      // Erro inesperado no servidor -> 500
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
      error.statusCode = NOT_FOUND_ERROR_CODE;
      throw error;
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Dados inválidos fornecidos',
        });
      }
      if (err.statusCode === NOT_FOUND_ERROR_CODE) {
        return res.status(NOT_FOUND_ERROR_CODE).send({ message: err.message });
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
      error.statusCode = NOT_FOUND_ERROR_CODE;
      throw error;
    })
    .then((user) => res.status(200).send(user))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return res.status(BAD_REQUEST_ERROR_CODE).send({
          message: 'Link de avatar inválido',
        });
      }
      if (err.statusCode === NOT_FOUND_ERROR_CODE) {
        return res.status(NOT_FOUND_ERROR_CODE).send({ message: err.message });
      }
      return res.status(INTERNAL_SERVER_ERROR_CODE).send({
        message: 'Ocorreu um erro no servidor',
      });
    });
};

// Exporta todos os controladores de usuários, incluindo getCurrentUser
module.exports = {
  getUsers,
  getUserById,
  getCurrentUser,
  createUser,
  login,
  updateProfile,
  updateAvatar,
};
