import React, { useContext } from "react";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";

export default function Card({
  card,
  isLiked,
  onCardClick,
  onCardLike,
  onCardDelete,
}) {
  const { currentUser } = useContext(CurrentUserContext);

  if (!card) return null;

  // Garante comparação segura entre string e ObjectId do dono do cartão
  const ownerId = card.owner?._id || card.owner;
  const currentUserId = currentUser?._id;
  const isOwn = Boolean(
    ownerId && currentUserId && String(ownerId) === String(currentUserId),
  );

  // Modificadores BEM para o estado de curtida e visibilidade da lixeira
  const cardLikeButtonClassName = `card__like-button ${
    isLiked ? "card__like-button_is-active" : ""
  }`;

  const cardDeleteButtonClassName = `card__delete-button ${
    isOwn ? "card__delete-button_visible" : "card__delete-button_hidden"
  }`;

  function handleLikeClick() {
    onCardLike(card, isLiked);
  }

  function handleDeleteClick() {
    onCardDelete(card);
  }

  return (
    <li className='card'>
      <img
        className='card__image'
        src={card.link}
        alt={card.name}
        onClick={() => onCardClick(card)}
      />
      {/* Exibe o ícone de lixeira apenas para o dono do cartão */}
      {isOwn && (
        <button
          className={cardDeleteButtonClassName}
          type='button'
          aria-label='Excluir cartão'
          onClick={handleDeleteClick}
        />
      )}
      <div className='card__description'>
        <h2 className='card__title'>{card.name}</h2>
        <div className='card__like-container'>
          <button
            className={cardLikeButtonClassName}
            type='button'
            onClick={handleLikeClick}
          />
        </div>
      </div>
    </li>
  );
}
