import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

import Cards from './cards';

const DeckDetails = () => {
  const { deckId } = useParams(); // Get deckId from URL params
  const [deck, setDeck] = useState(null);
  const navigate = useNavigate(); // Initialize navigate hook

  useEffect(() => {
    const fetchDeck = async () => {
      const deckRef = doc(db, 'decks', deckId);
      const deckSnap = await getDoc(deckRef);

      if (!auth.currentUser) {
        console.log("No current user or deckId");
        navigate('/');
        return;
      }

      if (deckSnap.exists()) {
        setDeck(deckSnap.data());
      } else {
        console.log("No such deck found!");
      }
    };

    fetchDeck();
  }, [deckId]);

  if (!deck) {
    return <p>Loading...</p>;
  }

  const goToHomepage = () => {
    navigate('/'); // Navigate to homepage
  };

  return (
    <div>
      <h1>{deck.name}</h1>
      <p>Owner: {deck.createdBy}</p>
      <p>{deck.description}</p>
      
      {/* Pass deckId directly from the URL params */}
      <Cards deckId={deckId} />
      
      <button onClick={goToHomepage}>Go Back to Homepage</button> {/* Go back to homepage button */}
    </div>
  );
};

export default DeckDetails;
