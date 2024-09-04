import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebase';
import NewDeck from './newDeck';

const DeckCollections = () => {
  const [showCreateNewDeck, setShowCreateNewDeck] = useState(false);
  const [decks, setDecks] = useState([]);
  const navigate = useNavigate();

  const fetchDecks = async () => {
    if (!auth.currentUser) {
      navigate('/'); // Redirect to the login page if not logged in
      return;
    }

    const decksRef = collection(db, 'decks');
    const q = query(decksRef, where('createdBy', '==', auth.currentUser.email));

    const querySnapshot = await getDocs(q);
    const decksArray = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
    setDecks(decksArray);
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleDeckClick = (deckId) => {
    if (!auth.currentUser) {
      console.log("No current user or deckId");
      navigate('/');
      return;
    }
    navigate(`/decks/${deckId}`);
  };

  const createNewDeck = () => {
    setShowCreateNewDeck(!showCreateNewDeck);
  };

  return (
    <div className='deckContainer'>
      {decks.length > 0 ? (
        decks.map((deck) => (
          <div 
            key={deck.id} 
            className="deck"
            onClick={() => handleDeckClick(deck.id)}
            style={{ cursor: 'pointer' }}
          >
            <h1>{deck.name}</h1>
            <p>{deck.description}</p>
          </div>
        ))
      ) : (
        <p>No decks found</p>
      )}
      
      {!showCreateNewDeck && (
        <button className='newBtn' onClick={createNewDeck}>+</button>
      )}

      {showCreateNewDeck && <NewDeck setShowCreateNewDeck={setShowCreateNewDeck} refetchDecks={fetchDecks}/> }
    </div>
  );
};

export default DeckCollections;
