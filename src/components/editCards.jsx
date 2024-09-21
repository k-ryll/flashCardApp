import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { db, auth, storage } from '../config/firebase';
import React, { useState } from 'react';

const EditCards = ({ deckId, refetchCards }) => {
  const [questionImgUrl, setQuestionImgUrl] = useState('');
  const [answerImgUrl, setAnswerImgUrl] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [questionImage, setQuestionImage] = useState(null);
  const [answerImage, setAnswerImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadImage = async (imageFile) => {
    const imageName = `${uuidv4()}_${imageFile.name}`;
    const imageRef = ref(storage, `images/${imageName}`);
    await uploadBytes(imageRef, imageFile);
    return getDownloadURL(imageRef);
  };

  const submitCard = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!deckId) {
      setErrorMessage('Invalid deck. Please try again.');
      setLoading(false);
      return;
    }

    if (!questionInput || !answerInput) {
      setErrorMessage('Question and answer are required.');
      setLoading(false);
      return;
    }

    try {
      let questionImgUrl = '';
      let answerImgUrl = '';

      if (questionImage) {
        questionImgUrl = await uploadImage(questionImage);
      }

      if (answerImage) {
        answerImgUrl = await uploadImage(answerImage);
      }

      const cardCollection = collection(db, 'cards');
      await addDoc(cardCollection, {
        question: questionInput,
        questionImage: questionImgUrl,
        answer: answerInput,
        answerImage: answerImgUrl,
        deck: deckId,
        createdBy: auth.currentUser.email,
        createdAt: serverTimestamp(),
      });

      // Reset form fields after successful submission
      setQuestionInput('');
      setAnswerInput('');
      setQuestionImage(null);
      setAnswerImage(null);
      setErrorMessage('');
      setLoading(false);

      // Clear file inputs
      document.querySelector('.questionImg').value = null;
      document.querySelector('.answerImg').value = null;

      // Trigger a refetch of the cards
      refetchCards();
    } catch (error) {
      setErrorMessage('Error adding card: ' + error.message);
      setLoading(false);
    }
  };

  const fileChangedHandler = (event, setImage) => {
    const file = event.target.files[0];
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (!validImageTypes.includes(file.type)) {
      window.alert('File does not support. You must use .png, .jpg, or .gif.');
      event.target.value = null;
      return false;
    }

    if (file.size > 10e6) {
      window.alert('Please upload a file smaller than 10 MB.');
      event.target.value = null;
      return false;
    }

    setImage(file);
  };

  return (
    <div className='addcardContainer'>
      <form onSubmit={submitCard} className='newDeckForm'>
        <div>
          <textarea
            className="questionInput"
            placeholder="Enter your question"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            disabled={loading}
          />
          <input
            type="file"
            onChange={(e) => fileChangedHandler(e, setQuestionImage)}
            className="questionImg"
            disabled={loading}
          />
        </div>
        <div>
          <textarea
            className="answerInput"
            placeholder="Enter your answer"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
            disabled={loading}
          />
          <input
            type="file"
            onChange={(e) => fileChangedHandler(e, setAnswerImage)}
            className="answerImg"
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Add Card'}
        </button>
      </form>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
};

export default EditCards;
