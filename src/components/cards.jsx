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
    const q = query(cardsRef, where('deck', '==', deckId));

    try {
      const querySnapshot = await getDocs(q);
      const fetchedCards = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCards(fetchedCards);
    } catch (error) {
      console.error('Error fetching the cards:', error);
    }
  }, [deckId]);

  useEffect(() => {
    fetchDeckOwner();
    fetchCards();
  }, [fetchDeckOwner, fetchCards]);

  // Function to calculate the mastery level
  const calculateMasteryLevel = () => {
    if (cards.length === 0) return 0;

    const totalConfidence = cards.reduce((sum, card) => sum + (card.confidenceLevel || 0), 0);
    const maxConfidence = cards.length * 5; // Max confidence level is 5 for each card
    return (totalConfidence / maxConfidence) * 100; // Return as percentage
  };

  const masteryLevel = calculateMasteryLevel();

  const handleStartClick = () => {
    setShowStudyPage(true);
  };

  return (
    <div className="cardContainer">
      {showStudyPage ? (
        <StudyCard cards={cards} setShowStudyPage={setShowStudyPage} deckId={deckId} />
      ) : (
        <>
          <button className='startBtn' onClick={handleStartClick}>Start Studying</button>
          {isOwner && <EditCards deckId={deckId} refetchCards={fetchCards} />}
          <div className='masteryLevel'>
            <h2>Mastery Level: {masteryLevel.toFixed(2)}%</h2>
          </div>
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
