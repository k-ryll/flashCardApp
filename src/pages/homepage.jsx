import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import DeckCollections from '../components/deckCollections';
import '../styles/homepage.css'

const Homepage = ({ setIsSignedIn }) => {
  
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsSignedIn(!!currentUser); // Update sign-in state based on user presence
    });

    return () => unsubscribe(); // Clean up subscription on unmount
  }, [setIsSignedIn]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("Signed out successfully!");
    } catch (error) {
      console.error(`Error [${error.code}]: ${error.message}`);
    }
  };

  

  if (!user) {
    return <div>You are signed out</div>; // Render appropriate UI when user is not signed in
  }

  return (
    <div className='homepage'>
      <header className='header'>
      <h1>Welcome, {user.displayName}</h1>
      <button className='signoutBtn' onClick={handleSignOut}>Signout</button>
      </header>
      
      
      <DeckCollections />
     
    </div>
  );
};

export default Homepage;
