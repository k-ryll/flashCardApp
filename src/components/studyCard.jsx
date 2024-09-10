import React, { useState, useEffect } from 'react';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase'; // Make sure to adjust the Firebase import

const StudyCard = ({ setShowStudyPage, cards }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [questionNumber, setQuestionNumber] = useState(0);
  const [batchCounter, setBatchCounter] = useState(0);

  // Function to handle confidence level selection
  const handleConfidenceSelect = (level) => {
    const currentCard = cards[questionNumber];

    // Update confidence levels for the current card
    setConfidenceLevels((prev) => ({
      ...prev,
      [currentCard.id]: level,
    }));

    // Increase the batch counter, and check if it's time to save to Firestore
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
    setConfidenceLevels({}); // Clear the stored levels after saving
  };

  // Function to move to the next question
  const handleNextQuestion = () => {
    setShowAnswer(false); // Hide answer for the next card
    if (questionNumber < cards.length - 1) {
      setQuestionNumber(questionNumber + 1);
    } else {
      alert('You have completed all the questions!');
      setShowStudyPage(false);
    }
  };

  // Ensure any remaining data is saved when the component unmounts
  useEffect(() => {
    return () => {
      if (batchCounter > 0) saveBatchToFirestore();
    };
  }, [batchCounter]);

  // Get the current card based on question number
  const currentCard = cards[questionNumber] || {};

  return (
    <div>
      <button onClick={() => setShowStudyPage(false)}>Close</button>

      <div>
        {showAnswer ? (
          <>
            <h1>{currentCard.answer || 'No answer available'}</h1>
            {currentCard.answerImage && <img src={currentCard.answerImage} alt="Answer" />}
            <div>
              <p>Select your confidence level:</p>
              <button onClick={() => handleConfidenceSelect(1)}>1 (Low)</button>
              <button onClick={() => handleConfidenceSelect(2)}>2</button>
              <button onClick={() => handleConfidenceSelect(3)}>3</button>
              <button onClick={() => handleConfidenceSelect(4)}>4</button>
              <button onClick={() => handleConfidenceSelect(5)}>5 (High)</button>
            </div>
          </>
        ) : (
          <div className='question'>
            <h1>{currentCard.question || 'No question available'}</h1>
            {currentCard.questionImage && <img src={currentCard.questionImage} alt="Question" />}
            <button onClick={() => setShowAnswer(true)}>Reveal Answer</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyCard;
