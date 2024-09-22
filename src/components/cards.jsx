import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import StudyCard from './studyCard';
import { useNavigate } from 'react-router-dom';
import '../styles/cards.css';
import { FaEdit } from 'react-icons/fa';
import EditCards from './editCards';

const Cards = ({ deckId }) => {
  const [cards, setCards] = useState([]);
  const [showStudyPage, setShowStudyPage] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');
  const navigate = useNavigate();

  const fetchDeckOwner = useCallback(async () => {
    if (!auth.currentUser || !deckId) {
      console.log("No current user or deckId");
      navigate('/');
      return;
    }

    try {
      const deckRef = doc(db, 'decks', deckId);
      const deckDoc = await getDoc(deckRef);

      if (deckDoc.exists()) {
        const deckData = deckDoc.data();
        if (deckData.createdBy === auth.currentUser.email) {
          setIsOwner(true);
        }
      } else {
        console.log("Deck document does not exist");
      }
    } catch (error) {
      console.error('Error fetching the deck owner:', error);
    }
  }, [deckId, navigate]);

  const fetchCards = useCallback(async () => {
    if (!auth.currentUser || !deckId) return;
  
    const cardsRef = collection(db, 'cards');
    const q = query(cardsRef, where('deck', '==', deckId), orderBy('createdAt', 'asc')); // Order by createdAt directly
  
    try {
      const querySnapshot = await getDocs(q);
      const fetchedCards = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCards(fetchedCards); // Set the cards without JS Date conversion
    } catch (error) {
      console.error('Error fetching the cards:', error);
    }
  }, [deckId]);

  useEffect(() => {
    fetchDeckOwner();
    fetchCards();
  }, [fetchDeckOwner, fetchCards]);

  const handleStartClick = () => {
    setShowStudyPage(true);
  };

  const handleEditClick = (card) => {
    setEditingCardId(card.id);
    setEditedQuestion(card.question);
    setEditedAnswer(card.answer);
  };

  const handleSave = async (cardId) => {
    const cardRef = doc(db, 'cards', cardId);
    try {
      await updateDoc(cardRef, {
        question: editedQuestion,
        answer: editedAnswer,
      });
      setEditingCardId(null); // Exit edit mode
      fetchCards(); // Refetch cards to get updated data
    } catch (error) {
      console.error('Error updating the card:', error);
    }
  };

  return (
    <div className="cardContainer">
      {showStudyPage ? (
        <StudyCard cards={cards} setShowStudyPage={setShowStudyPage} deckId={deckId} />
      ) : (
        <>
          <button className='startBtn' onClick={handleStartClick}>Start Studying</button>
          <EditCards deckId={deckId} refetchCards={fetchCards}/>
          <div className='cardPreviewContainer'>
            {cards.length > 0 ? (
              cards.map((card) => (
                <div key={card.id} className='cardPreview'>
                  
                  <div className='card-panel'>
                    <span>Question</span>
                    <div className='questionPreview'>
                      {editingCardId === card.id ? (
                        <textarea
                          value={editedQuestion}
                          onChange={(e) => setEditedQuestion(e.target.value)}
                          rows={3}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <h2>{card.question}</h2>
                      )}
                      {card.questionImage && <img src={card.questionImage} alt="Question" />}
                    </div>
                  </div>
                  <div className='card-panel'>
                    <span>Answer</span>
                    <div className='answerPreview'>
                      {editingCardId === card.id ? (
                        <textarea
                          value={editedAnswer}
                          onChange={(e) => setEditedAnswer(e.target.value)}
                          rows={3}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <h2>{card.answer}</h2>
                      )}
                      {card.answerImage && <img src={card.answerImage} alt="Answer" />}
                    </div>
                  </div>
                  <div className='edit'>
                  {isOwner && (
                    <FaEdit onClick={() => handleEditClick(card)} className='edit-icon' style={{ cursor: 'pointer', color: 'grey', height: '30px', width: '30px' }} />
                  )}
                  {editingCardId === card.id && (
                    <button onClick={() => handleSave(card.id)}>Save</button>
                  )}
                  </div>
                   
                </div>
              ))
            ) : (
              <p>No cards in this deck</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Cards;
