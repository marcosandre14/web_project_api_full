const {
  describe, it, before, after,
} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const express = require('express');
const { celebrate, Joi, errors } = require('celebrate');

const User = require('../models/user');
const { login, createUser } = require('../controllers/users');
const auth = require('../middlewares/auth');
const usersRouter = require('../routes/users');
const cardsRouter = require('../routes/cards');
const errorHandler = require('../middlewares/errorHandler');

const TEST_MONGO_URL = process.env.TEST_MONGO_URL || 'mongodb://localhost:27017/aroundb_test';

function requestJson({
  port, method, path, body, token,
}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {};

    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch (e) {
            data = raw;
          }
          resolve({ status: res.statusCode, body: data });
        });
      },
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Testes da API — Cadastro, Senha e Permissões de Cartões', () => {
  let server;
  let port;
  let tokenUserA;
  let tokenUserB;
  let cardIdUserA;

  before(async () => {
    await mongoose.connect(TEST_MONGO_URL);
    await mongoose.connection.db.dropDatabase();
    await User.syncIndexes();

    const app = express();
    app.use(express.json());

    app.post(
      '/signup',
      celebrate({
        body: Joi.object().keys({
          email: Joi.string().required().email(),
          password: Joi.string().required().min(8),
          name: Joi.string().min(2).max(30),
          about: Joi.string().min(2).max(30),
          avatar: Joi.string(),
        }),
      }),
      createUser,
    );

    app.post(
      '/signin',
      celebrate({
        body: Joi.object().keys({
          email: Joi.string().required().email(),
          password: Joi.string().required(),
        }),
      }),
      login,
    );

    app.use(auth);
    app.use('/users', usersRouter);
    app.use('/cards', cardsRouter);
    app.use(errors());
    app.use(errorHandler);

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    port = server.address().port;

    const userA = {
      email: 'usera@example.com',
      password: 'password123',
      name: 'User A',
    };
    const userB = {
      email: 'userb@example.com',
      password: 'password123',
      name: 'User B',
    };

    const resSignupA = await requestJson({
      port,
      method: 'POST',
      path: '/signup',
      body: userA,
    });
    assert.equal(resSignupA.status, 201);

    const resSignupB = await requestJson({
      port,
      method: 'POST',
      path: '/signup',
      body: userB,
    });
    assert.equal(resSignupB.status, 201);

    const resLoginA = await requestJson({
      port,
      method: 'POST',
      path: '/signin',
      body: { email: userA.email, password: userA.password },
    });
    assert.equal(resLoginA.status, 200);
    tokenUserA = resLoginA.body.token;

    const resLoginB = await requestJson({
      port,
      method: 'POST',
      path: '/signin',
      body: { email: userB.email, password: userB.password },
    });
    assert.equal(resLoginB.status, 200);
    tokenUserB = resLoginB.body.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
  });

  it('deve bloquear cadastro duplicado de e-mail com status 409', async () => {
    const duplicate = await requestJson({
      port,
      method: 'POST',
      path: '/signup',
      body: { email: 'usera@example.com', password: 'password123' },
    });

    assert.equal(duplicate.status, 409);
  });

  it('deve rejeitar senha com menos de 8 caracteres no /signup', async () => {
    const shortPass = await requestJson({
      port,
      method: 'POST',
      path: '/signup',
      body: { email: 'shortpass@example.com', password: '123' },
    });

    assert.equal(shortPass.status, 400);
  });

  it('deve impedir que outro usuário exclua o cartão de terceiros (403) e permitir que o dono exclua (200)', async () => {
    const createdCard = await requestJson({
      port,
      method: 'POST',
      path: '/cards',
      token: tokenUserA,
      body: {
        name: 'Montanha Teste',
        link: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      },
    });
    assert.equal(createdCard.status, 201);
    cardIdUserA = createdCard.body._id;

    const forbiddenDelete = await requestJson({
      port,
      method: 'DELETE',
      path: `/cards/${cardIdUserA}`,
      token: tokenUserB,
    });
    assert.equal(forbiddenDelete.status, 403);

    const ownerDelete = await requestJson({
      port,
      method: 'DELETE',
      path: `/cards/${cardIdUserA}`,
      token: tokenUserA,
    });
    assert.equal(ownerDelete.status, 200);
  });
});
