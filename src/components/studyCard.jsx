import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import '../styles/studyCards.css';

const StudyCard = ({ setShowStudyPage, cards }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [sortedCards, setSortedCards] = useState([]);
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConfidenceLevels = async () => {
      const levels = {};
      await Promise.all(cards.map(async (card) => {
        const docRef = doc(db, 'confidenceLevels', `${auth.currentUser.email}_${card.id}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          levels[card.id] = docSnap.data().confidenceLevel;
        } else {
          levels[card.id] = 0; // Default confidence if not found
        }
      }));
      setConfidenceLevels(levels);
    };

    fetchConfidenceLevels();
  }, [cards]);

  useEffect(() => {
    const shuffledCards = shuffleArray(cards);
    const filteredCards = filterCardsByConfidence(shuffledCards);
    setSortedCards(filteredCards);
  }, [cards, confidenceLevels]);

  const shuffleArray = (array) => {
    return array.slice().sort(() => Math.random() - 0.5);
  };

  const filterCardsByConfidence = (array) => {
    const lowestConfidence = Math.min(...array.map(card => confidenceLevels[card.id] || 0));
    return array.filter(card => confidenceLevels[card.id] <= lowestConfidence);
  };

  const handleConfidenceSelect = async (level) => {
    const currentCard = sortedCards[questionNumber];
    if (!currentCard) return;

    try {
      await setDoc(doc(db, 'confidenceLevels', `${auth.currentUser.email}_${currentCard.id}`), {
        confidenceLevel: level,
        userId: auth.currentUser.email,
        cardId: currentCard.id
      }, { merge: true });

      setConfidenceLevels(prev => ({
        ...prev,
        [currentCard.id]: level
      }));
    } catch (error) {
      console.error('Error updating confidence level:', error);
    }

    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    setLoading(true);
    setTimeout(() => {
      setShowAnswer(false);
      if (questionNumber < sortedCards.length - 1) {
        setQuestionNumber(prev => prev + 1);
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
    setIsLooping(prev => !prev);
  };

  const currentCard = sortedCards[questionNumber] || {};

  return (
    <div className="study-card-container">
      <button className="close-button" onClick={() => setShowStudyPage(false)}>Close</button>
      <button className="looping-button" onClick={toggleLooping}>
        {isLooping ? 'Disable Looping' : 'Enable Looping'}
      </button>

      {loading ? (
        <div className="loading-center">Loading next question...</div>
      ) : (
        <div className="study-panel">
          {showAnswer ? (
            <div className="answer">
              <h1>{currentCard.answer || 'No answer available'}</h1>
              {currentCard.answerImage && <img src={currentCard.answerImage} alt="Answer" />}
              <div className="confidence-buttons">
                {[1, 2, 3, 4, 5].map(level => (
                  <button key={level} onClick={() => handleConfidenceSelect(level)}>
                    {level} {level === 1 ? '(Low)' : level === 5 ? '(High)' : ''}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="question">
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
