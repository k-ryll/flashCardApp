import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Cards from './Cards';

const DeckDetails = () => {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [masteryLevel, setMasteryLevel] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeck = async () => {
      const deckRef = doc(db, 'decks', deckId);
      const deckSnap = await getDoc(deckRef);

      if (deckSnap.exists()) {
        const deckData = deckSnap.data();
        setDeck(deckData);
        
        setIsOwner(deckData.createdBy === auth.currentUser.email);

        await calculateMasteryLevel(deckId);
      } else {
        console.log("Deck not found");
        navigate('/');
      }
    };

    fetchDeck();
  }, [deckId, navigate]);

  const calculateMasteryLevel = async (deckId) => {
    const confidenceLevelsRef = collection(db, 'confidenceLevels');
    const cardIds = await fetchCardIds(deckId);
    const q = query(confidenceLevelsRef, where('userId', '==', auth.currentUser.email));
    const querySnapshot = await getDocs(q);
  
    let totalConfidence = 0;
    let count = 0;
  
    querySnapshot.forEach(doc => {
      const [cardId] = doc.id.split('_'); // Extract cardId from the document ID
      if (cardIds.includes(cardId)) { // Check if the cardId belongs to the current deck
        totalConfidence += doc.data().confidenceLevel || 0;
        count++;
      }
    });
  
    if (count > 0) {
      setMasteryLevel((totalConfidence / (count * 5)) * 100);
    } else {
      setMasteryLevel(0);
    }
  };
  
  

  const fetchCardIds = async (deckId) => {
    const cardsRef = collection(db, 'cards');
    const q = query(cardsRef, where('deck', '==', deckId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.id);
  };

  if (!deck) {
    if (!auth.currentUser) {
      console.log("No current user or deckId");
      navigate('/');
      return;
    }
    return <p>Loading...</p>;
  }

  const deleteDeckAndCards = async () => {
    if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      try {
        const cardsRef = collection(db, 'cards');
        const q = query(cardsRef, where('deck', '==', deckId));
        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        await deleteDoc(doc(db, 'decks', deckId));

        navigate('/');
      } catch (error) {
        console.error("Error deleting deck and cards:", error);
      }
    }
  };

  const goToHomepage = () => {
    navigate('/');
  };

  return (
    <div className='deckOverview'>
      <div className='deck-info'>
        <h1 className='deck-title'>{deck.name}</h1>
        <p className='deck-owner'>Owner: {deck.createdBy}</p>
        <p className='deck-description'>{deck.description}</p>
        <p className='mastery-level'>Mastery Level: {masteryLevel.toFixed(2)}%</p>
      </div>
  
      <div className='deck-buttons'>
        <button className='button go-home' onClick={goToHomepage}>Go Back to Homepage</button>
        {isOwner && <button className='button delete-deck' onClick={deleteDeckAndCards}>Delete Deck</button>}
      </div>
  
      <Cards deckId={deckId} />
    </div>
  );
  
};

export default DeckDetails;
