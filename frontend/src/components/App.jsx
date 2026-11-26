import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Header from "./Header/Header";
import Main from "./Main/Main";
import Footer from "./Footer/Footer";
import Login from "./Login";
import Register from "./Register";
import ProtectedRoute from "./ProtectedRoute";
import InfoTooltip from "./InfoTooltip";
import api from "../utils/Api";
import * as auth from "../utils/auth";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import ImagePopup from "./ImagePopup/ImagePopup";

function App() {
  // Estados globais da aplicação
  const [currentUser, setCurrentUser] = useState({});
  const [selectedCard, setSelectedCard] = useState(null);
  const [cards, setCards] = useState([]);

  // Estados de autenticação e token JWT
  const [token, setToken] = useState(() => localStorage.getItem("jwt") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState("");

  const navigate = useNavigate();

  // Estados de controle de abertura dos popups (modais)
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isConfirmDeletePopupOpen, setIsConfirmDeletePopupOpen] =
    useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  // Estado que monitora requisições assíncronas ativas para os botões de submit
  const [isLoading, setIsLoading] = useState(false);

  // Exibe feedback visual de erro no modal InfoTooltip
  const showErrorTooltip = (message) => {
    setIsSuccess(false);
    setTooltipMessage(message);
    setIsInfoTooltipOpen(true);
  };

  // Mantém o token sincronizado na instância da API e no localStorage
  useEffect(() => {
    api.setToken(token);
    if (token) {
      localStorage.setItem("jwt", token);
    } else {
      localStorage.removeItem("jwt");
    }
  }, [token]);

  // Verifica se há um token válido ao carregar a aplicação
  useEffect(() => {
    const savedToken = localStorage.getItem("jwt");
    if (!savedToken) return;

    api.setToken(savedToken);
    auth
      .checkToken(savedToken)
      .then((user) => {
        if (user && user.email) {
          setToken(savedToken);
          setIsLoggedIn(true);
          setUserEmail(user.email);
          setCurrentUser(user);
          navigate("/");
        }
      })
      .catch((err) => {
        console.error("Erro ao verificar token:", err);
        localStorage.removeItem("jwt");
        api.setToken("");
        setToken("");
        setIsLoggedIn(false);
        showErrorTooltip("Sua sessão expirou. Faça login novamente.");
      });
  }, [navigate]);

  // Busca informações do perfil e cartões iniciais quando autenticado
  useEffect(() => {
    if (isLoggedIn && token) {
      api.setToken(token);

      api
        .getUserInfo()
        .then((userData) => {
          setCurrentUser(userData);
          if (userData.email) setUserEmail(userData.email);
        })
        .catch((err) => {
          console.error("Erro ao carregar dados do usuário:", err);
          showErrorTooltip("Não foi possível carregar os dados do perfil.");
        });

      api
        .getInitialCards()
        .then((initialCards) => {
          setCards(initialCards);
        })
        .catch((err) => {
          console.error("Erro ao carregar os cartões iniciais:", err);
          showErrorTooltip("Não foi possível carregar os cartões.");
        });
    }
  }, [isLoggedIn, token]);

  // Função de registro de usuário
  const handleRegister = (email, password, name, about, avatar) => {
    auth
      .register(email, password, name, about, avatar)
      .then(() => {
        setIsSuccess(true);
        setTooltipMessage("Vitória! Você se registrou com sucesso.");
        setIsInfoTooltipOpen(true);
        navigate("/signin");
      })
      .catch((err) => {
        console.error("Erro no registro:", err);
        showErrorTooltip(
          "Não foi possível concluir o cadastro. Verifique os dados ou tente outro e-mail.",
        );
      });
  };

  // Função de login / autorização
  const handleLogin = (email, password) => {
    auth
      .authorize(email, password)
      .then((data) => {
        if (data && data.token) {
          api.setToken(data.token);
          setToken(data.token);
          setIsLoggedIn(true);
          setUserEmail(email);
          navigate("/");
        }
      })
      .catch((err) => {
        console.error("Erro no login:", err);
        showErrorTooltip("E-mail ou senha incorretos. Tente novamente.");
      });
  };

  // Função de logout
  const handleSignOut = () => {
    localStorage.removeItem("jwt");
    api.setToken("");
    setToken("");
    setIsLoggedIn(false);
    setUserEmail("");
    setCurrentUser({});
    navigate("/signin");
  };

  // Funções controladoras de abertura dos popups
  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }
  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }
  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }
  function handleCardClick(card) {
    setSelectedCard(card);
  }

  // Captura o cartão que o usuário deseja remover e abre o popup de confirmação
  function handleCardDeleteClick(card) {
    setCardToDelete(card);
    setIsConfirmDeletePopupOpen(true);
  }

  // Função centralizada responsável por redefinir os estados e fechar qualquer modal ativo
  function closeAllPopups() {
    setSelectedCard(null);
    setIsEditProfilePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsConfirmDeletePopupOpen(false);
    setIsInfoTooltipOpen(false);
    setTooltipMessage("");
    setCardToDelete(null);
  }

  // Intercala o estado de curtidas (like / dislike)
  async function handleCardLike(card, isLiked) {
    await api
      .changeLikeCardStatus(card._id, !isLiked)
      .then((newCard) => {
        setCards((state) =>
          state.map((currentCard) =>
            currentCard._id === card._id ? newCard : currentCard,
          ),
        );
      })
      .catch((error) => {
        console.error("Erro ao atualizar curtida:", error);
        showErrorTooltip("Não foi possível atualizar a curtida do cartão.");
      });
  }

  // Executa a exclusão definitiva do cartão
  async function handleConfirmDeleteSubmit(event) {
    event.preventDefault();
    if (!cardToDelete) return;
    setIsLoading(true);

    try {
      await api.deleteCard(cardToDelete._id);
      setCards((state) => state.filter((c) => c._id !== cardToDelete._id));
      closeAllPopups();
    } catch (error) {
      console.error("Erro ao deletar o cartão:", error);
      setIsConfirmDeletePopupOpen(false);
      setCardToDelete(null);
      showErrorTooltip("Não foi possível excluir o cartão.");
    } finally {
      setIsLoading(false);
    }
  }

  // Atualiza os dados de perfil
  const handleUpdateUser = (inputData) => {
    setIsLoading(true);
    api
      .setUserInfo(inputData)
      .then((newData) => {
        setCurrentUser(newData);
        closeAllPopups();
      })
      .catch((error) => {
        console.error("Erro ao atualizar perfil:", error);
        showErrorTooltip("Não foi possível atualizar os dados do perfil.");
      })
      .finally(() => setIsLoading(false));
  };

  // Atualiza a imagem de avatar
  const handleUpdateAvatar = (inputData) => {
    setIsLoading(true);
    api
      .setUserAvatar(inputData)
      .then((newData) => {
        setCurrentUser(newData);
        closeAllPopups();
      })
      .catch((error) => {
        console.error("Erro ao atualizar avatar:", error);
        showErrorTooltip("Não foi possível atualizar a foto de avatar.");
      })
      .finally(() => setIsLoading(false));
  };

  // Cria e adiciona um novo cartão
  const handleAddPlaceSubmit = (inputData) => {
    setIsLoading(true);
    api
      .addCard(inputData)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((error) => {
        console.error("Erro ao adicionar novo lugar:", error);
        showErrorTooltip("Não foi possível adicionar o novo cartão.");
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <CurrentUserContext.Provider
      value={{ currentUser, handleUpdateUser, handleUpdateAvatar }}
    >
      <div className='page'>
        <div className='page__content'>
          <Routes>
            {/* Rota Protegida (Página Principal) */}
            <Route
              path='/'
              element={
                <ProtectedRoute isLoggedIn={isLoggedIn}>
                  <Header
                    email={userEmail}
                    onSignOut={handleSignOut}
                    isLoggedIn={isLoggedIn}
                  />

                  <Main
                    cards={cards}
                    onCardLike={handleCardLike}
                    onCardDelete={handleCardDeleteClick}
                    onCardClick={handleCardClick}
                    onEditProfileClick={handleEditProfileClick}
                    onEditAvatarClick={handleEditAvatarClick}
                    onAddPlaceClick={handleAddPlaceClick}
                    isEditProfilePopupOpen={isEditProfilePopupOpen}
                    isEditAvatarPopupOpen={isEditAvatarPopupOpen}
                    isAddPlacePopupOpen={isAddPlacePopupOpen}
                    isConfirmDeletePopupOpen={isConfirmDeletePopupOpen}
                    isLoading={isLoading}
                    onCloseAllPopups={closeAllPopups}
                    onAddPlaceSubmit={handleAddPlaceSubmit}
                    onConfirmDeleteSubmit={handleConfirmDeleteSubmit}
                  />

                  <Footer />

                  {selectedCard && (
                    <ImagePopup card={selectedCard} onClose={closeAllPopups} />
                  )}
                </ProtectedRoute>
              }
            />

            {/* Rota de Login */}
            <Route
              path='/signin'
              element={
                <>
                  <Header linkTo='/signup' linkText='Inscrever-se' />
                  <Login onLogin={handleLogin} />
                </>
              }
            />

            {/* Rota de Registro */}
            <Route
              path='/signup'
              element={
                <>
                  <Header linkTo='/signin' linkText='Entrar' />
                  <Register onRegister={handleRegister} />
                </>
              }
            />

            {/* Redirecionamento para qualquer outra rota desconhecida */}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>

          {/* Modal de confirmação de sucesso/erro */}
          <InfoTooltip
            isOpen={isInfoTooltipOpen}
            onClose={closeAllPopups}
            isSuccess={isSuccess}
            message={tooltipMessage}
          />
        </div>
      </div>
    </CurrentUserContext.Provider>
  );
}

export default App;
