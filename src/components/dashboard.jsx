import { collection, query, onSnapshot, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { db, auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import NewDeck from './newDeck';

const Dashboard = () => {
  const [showCreateNewDeck, setShowCreateNewDeck] = useState(false);
  const [decks, setDecks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      console.log("No user is currently signed in.");
      return;
    }

    const decksRef = collection(db, 'decks');
    const q = query(decksRef, where('createdBy', '==', auth.currentUser.email));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const decksArray = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        console.log('Updated decks:', decksArray); // Debugging line
        setDecks(decksArray);
      },
      (error) => {
        console.error('Error fetching decks:', error);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();

  }, [auth.currentUser?.email]);

  const handleDeckClick = (deckId) => {
    navigate(`/decks/${deckId}`);
  };

  const createNewDeck = () => {
    setShowCreateNewDeck(!showCreateNewDeck);
  };

  return (
    <div className=''>
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

      {showCreateNewDeck && <NewDeck setShowCreateNewDeck={setShowCreateNewDeck}/> }
    </div>
  );
};

export default Dashboard;
