import React, { useState, useEffect } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const StudyCard = ({ setShowStudyPage, cards }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [questionNumber, setQuestionNumber] = useState(0);
  const [batchCounter, setBatchCounter] = useState(0);
  const [isLooping, setIsLooping] = useState(true); // Default to looping
  const [sortedCards, setSortedCards] = useState([]);
  const [loading, setLoading] = useState(false); // Add a loading state

  // Shuffle function
  const shuffleArray = (array) => {
    let shuffledArray = array.slice(); // Copy the array
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  // Function to sort cards by confidence level
  const sortByConfidence = (array) => {
    return array.slice().sort((a, b) => {
      const aConfidence = confidenceLevels[a.id] || 0; // Default to 0 if no confidence level set
      const bConfidence = confidenceLevels[b.id] || 0;
      return bConfidence - aConfidence; // Reverse the order
    });
  };
  useEffect(() => {
    // Shuffle the cards and then sort them by confidence level
    const shuffledCards = shuffleArray(cards);
    setSortedCards(sortByConfidence(shuffledCards));
  }, [cards, confidenceLevels]); // Re-shuffle and sort if confidenceLevels change

  // Function to handle confidence level selection
  const handleConfidenceSelect = (level) => {
    const currentCard = sortedCards[questionNumber];

    // Update confidence levels for the current card
    setConfidenceLevels((prev) => ({
      ...prev,
      [currentCard.id]: level,
    }));

    // Increase the batch counter and check if it's time to save to Firestore
    setBatchCounter(batchCounter + 1);

    if (batchCounter >= 9) {
      saveBatchToFirestore(); // Save every 10 rounds
      setBatchCounter(0);
    }

    // Move to the next question
    handleNextQuestion();
  };

  // Function to batch save confidence levels to Firestore
  const saveBatchToFirestore = async () => {
    const batch = writeBatch(db);

    Object.keys(confidenceLevels).forEach((cardId) => {
      const cardRef = doc(db, 'cards', cardId);
      batch.set(cardRef, { confidenceLevel: confidenceLevels[cardId] }, { merge: true });
    });

    await batch.commit();
    console.log("levels set");
    setConfidenceLevels({}); // Clear the stored levels after saving
  };

  // Function to move to the next question
  const handleNextQuestion = () => {
    setLoading(true); // Start loading

    setTimeout(() => {
      setShowAnswer(false); // Hide answer for the next card
      if (questionNumber < sortedCards.length - 1) {
        setQuestionNumber(questionNumber + 1);
      } else if (isLooping) {
        setQuestionNumber(0); // Loop back to the start
      } else {
        alert('You have completed all the questions!');
        setShowStudyPage(false);
      }
      setLoading(false); // End loading
    }, 500); // Adjust the delay for smooth transition
  };

  // Function to toggle looping
  const toggleLooping = () => {
    setIsLooping(!isLooping);
  };

  // Ensure any remaining data is saved when the component unmounts
  useEffect(() => {
    return () => {
      if (batchCounter > 0) saveBatchToFirestore();
    };
  }, [batchCounter]);

  // Get the current card based on question number
  const currentCard = sortedCards[questionNumber] || {};

  return (
    <div>
      <button onClick={() => setShowStudyPage(false)}>Close</button>
      <button onClick={toggleLooping}>
        {isLooping ? 'Disable Looping' : 'Enable Looping'}
      </button>

      {loading ? (
        <div className="loading-center">Loading next question...</div> // Apply the loading-center class
      ) : (
        <div className='study-panel'>
          {showAnswer ? (
            <div className='answer'>
              <h1>{currentCard.answer || 'No answer available'}</h1>
              {currentCard.answerImage && <img src={currentCard.answerImage} alt="Answer" />}
              <div>
                <button onClick={() => handleConfidenceSelect(1)}>1 (Low)</button>
                <button onClick={() => handleConfidenceSelect(2)}>2</button>
                <button onClick={() => handleConfidenceSelect(3)}>3</button>
                <button onClick={() => handleConfidenceSelect(4)}>4</button>
                <button onClick={() => handleConfidenceSelect(5)}>5 (High)</button>
              </div>
            </div>
          ) : (
            <div className='question'>
              <h1>{currentCard.question || 'No question available'}</h1>
              {currentCard.questionImage && <img src={currentCard.questionImage} alt="Question" />}
              <button onClick={() => setShowAnswer(true)}>Reveal Answer</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyCard;
