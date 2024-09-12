import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Cards from './cards';

const DeckDetails = () => {
  const { deckId } = useParams();
  const [deck, setDeck] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeck = async () => {
      if (!auth.currentUser) {
        console.log("No current user or deckId");
        navigate('/');
        return;
      }

      const deckRef = doc(db, 'decks', deckId);
      const deckSnap = await getDoc(deckRef);

      if (deckSnap.exists()) {
        setDeck(deckSnap.data());
      } else {
        console.log("No such deck found!");
      }
    };

    fetchDeck();
  }, [deckId, navigate]);

  if (!deck) {
    return <p>Loading...</p>;
  }

  const deleteDeckAndCards = async () => {
    if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      try {
        // Delete all cards associated with the deck
        const cardsRef = collection(db, 'cards');
        const q = query(cardsRef, where('deck', '==', deckId)); // Assuming 'deck' field in 'cards' refers to the deck ID
        const querySnapshot = await getDocs(q);

        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises); // Delete all cards

        // Delete the deck itself
        await deleteDoc(doc(db, 'decks', deckId));

        // Navigate back to homepage
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
      <h1>{deck.name}</h1>
      <p>Owner: {deck.createdBy}</p>
      <p>{deck.description}</p>
      </div>
      <div className='deck-buttons'>
      <button onClick={goToHomepage}>Go Back to Homepage</button>
      <button onClick={deleteDeckAndCards}>Delete Deck</button>
      </div>
      
      <Cards deckId={deckId} />
    </div>
  );
};

export default DeckDetails;
