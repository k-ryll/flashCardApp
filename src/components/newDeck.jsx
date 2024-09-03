import React, { useState } from 'react';
import { auth, db } from '../config/firebase';
import { addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const NewDeck = ({setShowCreateNewDeck, refetchDecks}) => {
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // State for error messages
  const [ buttonDisable, setButtonDisable] = useState(false);

  const submitDeck = async (e) => {
    e.preventDefault();

    // Ensure user is signed in
    if (!auth.currentUser || !auth.currentUser.email) {
      setErrorMessage('User is not signed in or email is not available.');
      return;
    }

    if (!deckName || !deckDescription) {
      setErrorMessage('Deck name and description are required.');
      return;
    }
    setButtonDisable(true);

    try {
      const deckCollection = collection(db, 'decks');
      
      // Query to check if the deck name already exists for the current user
      const deckQuery = query(deckCollection, where('createdBy', '==', auth.currentUser.email), where('name', '==', deckName));
      const deckQuerySnapshot = await getDocs(deckQuery);

      if (!deckQuerySnapshot.empty) {
        setErrorMessage('A deck with this name already exists.');
        return;
      }

      // If the deck doesn't exist, add it
      await addDoc(deckCollection, {
        name: deckName,
        description: deckDescription,
        createdBy: auth.currentUser.email,
        createdAt: serverTimestamp(),
      });
      await refetchDecks();
      // Reset form fields after successful submission
      setDeckName('');
      setDeckDescription('');
      setErrorMessage(''); // Clear any previous error messages
    } catch (error) {
      setErrorMessage('Error adding deck: ' + error.message);
    } finally {
      setButtonDisable(false);
    }
  };

  const handleClose = () => {
    setShowCreateNewDeck(false);
  }

  return (
    <div>
      <div>
      <h2>Add New Deck</h2>
      <button onClick={handleClose}>X</button>
      </div>
      

      <form onSubmit={submitDeck}>
        <input
          type="text"
          className="deckName"
          placeholder="Deck Name"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
        />
        <textarea
          className="deckDescription"
          placeholder="Description..."
          value={deckDescription}
          onChange={(e) => setDeckDescription(e.target.value)}
        />
        <button type="submit" disabled={buttonDisable}>
          Add Deck
        </button>
      </form>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
};

export default NewDeck;
