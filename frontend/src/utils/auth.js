// URL base do back-end (generico para desenvolvimento e produção)
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Verifica se a resposta HTTP foi bem-sucedida e converte para JSON
const checkResponse = (res) => {
  if (res.ok) {
    return res.json();
  }
  return Promise.reject(`Erro: ${res.status}`);
};

// Cadastro de novo usuário (POST /signup)
// Aceita name, about e avatar opcionais caso o formulário envie apenas email e password
export const register = (email, password, name, about, avatar) => {
  const body = { email, password };
  if (name) body.name = name;
  if (about) body.about = about;
  if (avatar) body.avatar = avatar;

  return fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).then(checkResponse);
};

// Autenticação / Login (POST /signin) — salva o JWT no localStorage e retorna { token }
export const authorize = (email, password) =>
  fetch(`${BASE_URL}/signin`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })
    .then(checkResponse)
    .then((data) => {
      if (data.token) {
        localStorage.setItem("jwt", data.token);
      }
      return data;
    });

// Valida o token salvo e busca os dados do usuário atual (GET /users/me)
export const checkToken = (token) =>
  fetch(`${BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then(checkResponse);
