import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import EditCards from './editCards';
import StudyCard from './studyCard';
import { useNavigate } from 'react-router-dom';
import '../styles/cards.css';

const Cards = ({ deckId }) => {
  const [cards, setCards] = useState([]);
  const [showStudyPage, setShowStudyPage] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
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
    const q = query(
      cardsRef,
      where('deck', '==', deckId)
    );

    try {
      const querySnapshot = await getDocs(q);
      const uniqueCards = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Filter out duplicate cards by id
      const filteredCards = uniqueCards.filter((card, index, self) =>
        index === self.findIndex((t) => t.id === card.id)
      );
      setCards(filteredCards);
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

  return (
    <div className="cardContainer">
      {showStudyPage ? (
        <StudyCard cards={cards} setShowStudyPage={setShowStudyPage} />
      ) : (
        <>
          <button className='startBtn' onClick={handleStartClick}>Start Studying</button>
          {isOwner && <EditCards deckId={deckId} refetchCards={fetchCards} />}
          <div className='cardPrviewContainer'>
          {cards.length > 0 ? (
            cards.map((card) => (
              <div key={card.id} className='cardPreview'>
                <div className='questionPreview'>
                  <h2>{card.question}</h2>
                 {card.questionImage && <img src={card.questionImage} alt="Question" />} 
                </div>
                <div className='answerPreview'>
                  <h2>{card.answer}</h2>
                  {card.answerImage && <img src={card.answerImage} alt="Answer" />}
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
