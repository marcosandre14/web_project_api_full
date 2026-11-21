import { BASE_URL } from "./auth";

class Api {
  constructor({ baseUrl, headers = {} }) {
    this._baseUrl = baseUrl;
    this._headers = {
      "Content-Type": "application/json",
      ...headers,
    };
    this._token = "";
  }

  // Atualiza o token JWT usado nas requisições autenticadas
  setToken(token) {
    this._token = token || "";
  }

  // Monta os cabeçalhos incluindo Bearer token quando disponível
  _getHeaders() {
    const headers = { ...this._headers };
    if (this._token) {
      headers.Authorization = `Bearer ${this._token}`;
    }
    return headers;
  }

  _checkResponse(res) {
    if (res.ok) {
      return res.json();
    }
    return Promise.reject(`Erro: ${res.status}`);
  }

  // Busca dados do usuário atual (GET /users/me)
  getUserInfo() {
    return fetch(`${this._baseUrl}/users/me`, {
      headers: this._getHeaders(),
    }).then(this._checkResponse);
  }

  // Busca cartões iniciais (GET /cards)
  getInitialCards() {
    return fetch(`${this._baseUrl}/cards`, {
      headers: this._getHeaders(),
    }).then(this._checkResponse);
  }

  // Curtir ou descurtir cartão (PUT / DELETE /cards/:cardId/likes)
  changeLikeCardStatus(cardId, shouldLike) {
    return fetch(`${this._baseUrl}/cards/${cardId}/likes`, {
      method: shouldLike ? "PUT" : "DELETE",
      headers: this._getHeaders(),
    }).then(this._checkResponse);
  }

  // Excluir cartão (DELETE /cards/:cardId)
  deleteCard(cardId) {
    return fetch(`${this._baseUrl}/cards/${cardId}`, {
      method: "DELETE",
      headers: this._getHeaders(),
    }).then(this._checkResponse);
  }

  // Criar novo cartão (POST /cards)
  addCard({ name, link }) {
    return fetch(`${this._baseUrl}/cards`, {
      method: "POST",
      headers: this._getHeaders(),
      body: JSON.stringify({ name, link }),
    }).then(this._checkResponse);
  }

  // Atualizar perfil (PATCH /users/me)
  setUserInfo({ name, about }) {
    return fetch(`${this._baseUrl}/users/me`, {
      method: "PATCH",
      headers: this._getHeaders(),
      body: JSON.stringify({ name, about }),
    }).then(this._checkResponse);
  }

  // Atualizar avatar (PATCH /users/me/avatar)
  setUserAvatar({ avatar }) {
    return fetch(`${this._baseUrl}/users/me/avatar`, {
      method: "PATCH",
      headers: this._getHeaders(),
      body: JSON.stringify({ avatar }),
    }).then(this._checkResponse);
  }
}

const api = new Api({
  baseUrl: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
