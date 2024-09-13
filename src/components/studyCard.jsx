import React, { useState, useEffect } from 'react';
import { writeBatch, doc, getDocs, collection, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const StudyCard = ({ setShowStudyPage, cards, deckId }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [sortedCards, setSortedCards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Group cards by confidence level and sort
  const groupByConfidence = (array) => {
    const confidenceLevels = array.reduce((acc, card) => {
      const level = card.confidenceLevel || 0;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(card);
      return acc;
    }, {});
  
    const levels = Object.keys(confidenceLevels).sort((a, b) => a - b);
    const sortedCards = [];
  
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const sortedLevelCards = confidenceLevels[level].sort((a, b) => {
        // Add a sorting logic here, e.g., by card ID or creation date
        return a.id - b.id;
      });
      while (sortedCards.length < array.length && sortedLevelCards.length > 0) {
        sortedCards.push(sortedLevelCards.shift());
      }
    }
  
    return sortedCards;
  };

  useEffect(() => {
    const shuffledCards = shuffleArray(cards);
    setSortedCards(groupByConfidence(shuffledCards));
  }, [cards]);

  const shuffleArray = (array) => {
    let shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  const handleConfidenceSelect = async (level) => {
    const currentCard = sortedCards[questionNumber];
    if (!currentCard) {
      console.error('No card available for selection');
      return;
    }

    const currentConfidenceLevel = currentCard.confidenceLevel || 0;

    // Update confidence level only if it has changed
    if (level !== currentConfidenceLevel) {
      try {
        // Update Firestore immediately
        await setDoc(doc(db, 'cards', currentCard.id), { confidenceLevel: level }, { merge: true });
        // Update local state
        setSortedCards(prevCards => prevCards.map(card =>
          card.id === currentCard.id ? { ...card, confidenceLevel: level } : card
        ));
      } catch (error) {
        console.error('Error updating confidence level:', error);
      }
    }

    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    setLoading(true);

    setTimeout(() => {
      setShowAnswer(false);
      if (questionNumber < sortedCards.length - 1) {
        setQuestionNumber(questionNumber + 1);
      } else if (isLooping) {
        setQuestionNumber(0);
      } else {
        alert('You have completed all the questions!');
        setShowStudyPage(false);
      }
      setLoading(false);
    }, 500);
  };

  const toggleLooping = () => {
    setIsLooping(!isLooping);
  };

  const currentCard = sortedCards[questionNumber] || {};

  return (
    <div>
      <button onClick={() => setShowStudyPage(false)}>Close</button>
      <button onClick={toggleLooping}>
        {isLooping ? 'Disable Looping' : 'Enable Looping'}
      </button>

      {loading ? (
        <div className="loading-center">Loading next question...</div>
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
