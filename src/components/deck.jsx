import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
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

  const goToHomepage = () => {
    navigate('/');
  };

  return (
    <div>
      <h1>{deck.name}</h1>
      <p>Owner: {deck.createdBy}</p>
      <p>{deck.description}</p>
      
      <Cards deckId={deckId} />
      
      <button onClick={goToHomepage}>Go Back to Homepage</button>
    </div>
  );
};

export default DeckDetails;
