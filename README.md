# Around The U.S. — Full-Stack Web Application

Aplicação web full-stack desenvolvida para compartilhamento de fotos e lugares, composta por um front-end em **React + Vite** e um back-end em **Node.js + Express + MongoDB (Mongoose)**, implantada em nuvem com domínio, HTTPS/SSL e gerenciamento de processos via **PM2**.

---

## Acesso ao Aplicativo e Servidor

- **Aplicação (Front-end):** [https://marcos-around.duckdns.org](https://marcos-around.duckdns.org)
- **API (Back-end):** [https://api-marcos-around.duckdns.org](https://api-marcos-around.duckdns.org)
- **Servidor:** Instância em nuvem no Google Cloud Platform (Ubuntu + Nginx como proxy reverso + PM2 + MongoDB).

---

## Funcionalidades

- **Registro e Autenticação:** cadastro de novos usuários (`/signup`) com hash de senha (`bcryptjs`), login (`/signin`) com emissão de token **JWT** (expiração de 7 dias) e rotas protegidas.
- **Perfil e Avatar:** visualização e edição de nome, descrição e foto de perfil do usuário autenticado.
- **Galeria de Cartões:** listagem compartilhada de cartões, criação de novos cartões (título e URL de imagem) e exclusão restrita ao dono do cartão.
- **Curtidas:** curtir e descurtir cartões com persistência no banco de dados e atualização visual do estado ativo.
- **Validação, Erros e Logs:** validação de requisições com `celebrate` e `Joi` (incluindo validação de URLs e IDs do MongoDB), middleware centralizado de tratamento de erros e registro de solicitações e erros em formato JSON.

---

## Tecnologias e Técnicas Utilizadas

- **Front-end:** React, Vite, React Router, Context API, Fetch API, CSS seguindo a metodologia **BEM**.
- **Back-end:** Node.js, Express, MongoDB, Mongoose, `jsonwebtoken`, `bcryptjs`, `celebrate`, `Joi`, `validator`, `cors`, `dotenv` e ESLint.
- **Infraestrutura e DevOps:** Google Cloud VM, Linux (Ubuntu), Nginx (proxy reverso e redirecionamento HTTPS), Certbot / Let's Encrypt (certificados SSL), PM2 (execução contínua e recuperação automática de falhas).
