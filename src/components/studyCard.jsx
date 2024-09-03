import React, { useState, useEffect } from 'react';

const StudyCard = ({ setShowStudyPage, cards }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctScore, setCorrectScore] = useState(0);
  const [incorrectScore, setIncorrectScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [isLooping, setIsLooping] = useState(false); // State for looping
  const [isRandom, setIsRandom] = useState(false); // State for random cards
  const [unseenQuestions, setUnseenQuestions] = useState(new Set()); // Track unseen questions

  useEffect(() => {
    if (isRandom) {
      setUnseenQuestions(new Set(Array.from({ length: cards.length }, (_, i) => i)));
    } else {
      setUnseenQuestions(new Set());
    }
  }, [isRandom, cards.length]);

  const handleClose = () => {
    setShowStudyPage(false);
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleCorrect = () => {
    setCorrectScore(correctScore + 1);
    handleNextQuestion();
  };

  const handleIncorrect = () => {
    setIncorrectScore(incorrectScore + 1);
    handleNextQuestion();
  };

 const handleNextQuestion = () => {
  setShowAnswer(false);

  if (isRandom) {
    const remainingQuestions = Array.from(unseenQuestions);

    if (remainingQuestions.length === 0) {
      if (isLooping) {
        // Reset unseen questions only when looping
        const allQuestionIndexes = new Set(Array.from({ length: cards.length }, (_, i) => i));
        setUnseenQuestions(allQuestionIndexes);
        handleNextQuestion(); // Call again to select the first question
        return;
      } else {
        alert('You have completed all the questions!');
        setShowStudyPage(false);
        return;
      }
    }

    const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
    const nextQuestionIndex = remainingQuestions[randomIndex];
    setQuestionNumber(nextQuestionIndex);
    setUnseenQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(nextQuestionIndex);
      return newSet;
    });

  } else {
    if (questionNumber < cards.length - 1) {
      setQuestionNumber(questionNumber + 1);
    } else if (isLooping) {
      setQuestionNumber(0);
    } else {
      alert('You have completed all the questions!');
      setShowStudyPage(false);
    }
  }
};

  

  const toggleLooping = () => {
    setIsLooping(!isLooping); // Toggle the looping state
  };

  const toggleRandom = () => {
    setIsRandom(!isRandom); // Toggle the random state
  };

  if (!cards || cards.length === 0) {
    return <p>No cards available</p>;
  }

  // Ensure questionNumber is within valid range
  const validQuestionNumber = Math.min(Math.max(questionNumber, 0), cards.length - 1);
  const currentCard = cards[validQuestionNumber] || {};

  return (
    <div>
      <button onClick={handleClose}>X</button>
      <div>
        {showAnswer ? (
          <>
            <h1>{currentCard.answer || 'No answer available'}</h1>
            {currentCard.answerImage && (
              <img src={currentCard.answerImage} alt="Answer" />
            )}
          </>
        ) : (
          <>
            <h1>{currentCard.question || 'No question available'}</h1>
            {currentCard.questionImage && (
              <img src={currentCard.questionImage} alt="Question" />
            )}
          </>
        )}
      </div>
      <div>
        {showAnswer ? (
          <div>
            <button onClick={handleCorrect}>Correct</button>
            <button onClick={handleIncorrect}>Incorrect</button>
          </div>
        ) : (
          <button onClick={handleRevealAnswer}>Reveal answer</button>
        )}
      </div>
      <div>
        <p>Correct: {correctScore}</p>
        <p>Incorrect: {incorrectScore}</p>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={isLooping} onChange={toggleLooping} />
          Loop questions
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={isRandom} onChange={toggleRandom} />
          Random order
        </label>
      </div>
    </div>
  );
};

export default StudyCard;
