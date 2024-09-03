import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Homepage from './pages/homepage';
import SignupPage from './pages/signupPage';
import './styles/App.css'
import DeckDetails from './components/deck';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Default route */}
        <Route 
          path="/" 
          element={isSignedIn ? <Navigate to="/homepage" /> : <SignupPage setIsSignedIn={setIsSignedIn} />} 
        />

        {/* Homepage route */}
        <Route 
          path="/homepage" 
          element={isSignedIn ? <Homepage setIsSignedIn={setIsSignedIn} /> : <Navigate to="/" />} 
        />

        {/* Catch-all route for undefined paths */}
        <Route 
          path="*" 
          element={<Navigate to="/" />} 
        />

      <Route path="/decks/:deckId" element={<DeckDetails />} />
      
      </Routes>
    </Router>
  );
}

export default App;
