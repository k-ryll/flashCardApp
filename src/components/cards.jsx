import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import EditCards from './editCards';
import StudyCard from './studyCard';

const Cards = ({ deckId }) => {
  const [cards, setCards] = useState([]);
  const [showStudyPage, setShowStudyPage] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const fetchDeckOwner = useCallback(async () => {
    if (!auth.currentUser || !deckId) {
      console.log("No current user or deckId");
      return;
    }

    try {
      const deckRef = doc(db, 'decks', deckId); 
      const deckDoc = await getDoc(deckRef);

      if (deckDoc.exists()) {
        const deckData = deckDoc.data();
        console.log("Deck Data:", deckData);
        console.log("Current User Email:", auth.currentUser.email);

        if (deckData.createdBy === auth.currentUser.email) {
          setIsOwner(true);
          console.log("User is the owner of the deck");
        } else {
          console.log("User is NOT the owner of the deck");
        }
      } else {
        console.log("Deck document does not exist");
      }
    } catch (error) {
      console.error('Error fetching the deck owner:', error);
    }
  }, [deckId]);

  const fetchCards = useCallback(async () => {
    if (!auth.currentUser || !deckId) return;

    const cardsRef = collection(db, 'cards');
    const q = query(
      cardsRef,
      where('deck', '==', deckId)  // Assuming 'deck' field in 'cards' refers to the deck ID
    );

    try {
      const querySnapshot = await getDocs(q);
      const cardsArray = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCards(cardsArray);
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
        <StudyCard cards={cards} setShowStudyPage={setShowStudyPage}/>
      ) : (
        <>
          <button className='startBtn' onClick={handleStartClick}>Start Studying</button>
          {isOwner && <EditCards deckId={deckId} refetchCards={fetchCards} />}
          {cards.length > 0 ? (
            cards.map((card) => (
              <div key={card.id}>
                <h2>{card.question}</h2>
                <img src={card.questionImage} alt="" />
                <h2>{card.answer}</h2>
                <img src={card.answerImage} alt="" />
              </div>
            ))
          ) : (
            <p>No cards in this deck</p>
          )}
        </>
      )}
    </div>
  );
};

export default Cards;
