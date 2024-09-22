import React, { useEffect, useState, useCallback } from 'react';
import { db,  storage, auth } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import StudyCard from './studyCard';
import { useNavigate } from 'react-router-dom';
import '../styles/cards.css';
import { FaEdit } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import EditCards from './addCard';

const Cards = ({ deckId }) => {
  const [cards, setCards] = useState([]);
  const [showStudyPage, setShowStudyPage] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');
  const [editedQuestionImage, setEditedQuestionImage] = useState(null);
  const [editedAnswerImage, setEditedAnswerImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchDeckOwner = useCallback(async () => {
    if (!auth.currentUser || !deckId) {
      console.log("No current user or deckId");
      navigate('/');
      return;
    }

    try {
      const deckRef = doc(db, 'decks', deckId);
      const deckDoc = await getDoc(deckRef);

      if (deckDoc.exists()) {
        const deckData = deckDoc.data();
        if (deckData.createdBy === auth.currentUser.email) {
          setIsOwner(true);
        }
      } else {
        console.log("Deck document does not exist");
      }
    } catch (error) {
      console.error('Error fetching the deck owner:', error);
    }
  }, [deckId, navigate]);

  const fetchCards = useCallback(async () => {
    if (!auth.currentUser || !deckId) return;

    const cardsRef = collection(db, 'cards');
    const q = query(cardsRef, where('deck', '==', deckId), orderBy('createdAt', 'asc'));

    try {
      const querySnapshot = await getDocs(q);
      const fetchedCards = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setCards(fetchedCards);
    } catch (error) {
      console.error('Error fetching the cards:', error);
    }
  }, [deckId]);

  useEffect(() => {
    fetchDeckOwner();
    fetchCards();
  }, [fetchDeckOwner, fetchCards]);

  const handleStartClick = () => {
    setShowStudyPage(true);
  };

  const handleEditClick = (card) => {
    setEditingCardId(card.id);
    setEditedQuestion(card.question);
    setEditedAnswer(card.answer);
    setEditedQuestionImage(card.questionImage || null); // Load existing image
    setEditedAnswerImage(card.answerImage || null); // Load existing image;
  };

  const uploadImage = async (imageFile) => {
    const imageName = `${uuidv4()}_${imageFile.name}`;
    const imageRef = ref(storage, `images/${imageName}`);
    await uploadBytes(imageRef, imageFile);
    return getDownloadURL(imageRef);
  };

  const handleSave = async (cardId) => {
    const cardRef = doc(db, 'cards', cardId);
    try {
      // Logic to upload new images if they are provided
      let questionImgUrl = editedQuestionImage;
      let answerImgUrl = editedAnswerImage;

      if (editedQuestionImage instanceof File) {
        questionImgUrl = await uploadImage(editedQuestionImage);
      }
      if (editedAnswerImage instanceof File) {
        answerImgUrl = await uploadImage(editedAnswerImage);
      }

      await updateDoc(cardRef, {
        question: editedQuestion,
        answer: editedAnswer,
        questionImage: questionImgUrl,
        answerImage: answerImgUrl,
      });

      setEditingCardId(null); // Exit edit mode
      fetchCards(); // Refetch cards to get updated data
    } catch (error) {
      console.error('Error updating the card:', error);
    } finally {
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
    <div className="cardContainer">
      {showStudyPage ? (
        <StudyCard cards={cards} setShowStudyPage={setShowStudyPage} deckId={deckId} />
      ) : (
        <>
          <button className='startBtn' onClick={handleStartClick}>Start Studying</button>
          <EditCards deckId={deckId} refetchCards={fetchCards}/>
          <div className='cardPreviewContainer'>
            {cards.length > 0 ? (
              cards.map((card) => (
                <div key={card.id} className='cardPreview'>
                  <div className='card-panel'>
                    <span>Question</span>
                    <div className='questionPreview'>
                      {editingCardId === card.id ? (
                        <>
                          <textarea
                            value={editedQuestion}
                            onChange={(e) => setEditedQuestion(e.target.value)}
                            rows={3}
                            style={{ width: '100%' }}
                          />
                          <input
                            type="file"
                            onChange={(e) => fileChangedHandler(e, setEditedQuestionImage)}
                            disabled={loading}
                          />
                        </>
                      ) : (
                        <h2>{card.question}</h2>
                      )}
                      {card.questionImage && <img src={card.questionImage} alt="Question" />}
                    </div>
                  </div>
                  <div className='card-panel'>
                    <span>Answer</span>
                    <div className='answerPreview'>
                      {editingCardId === card.id ? (
                        <>
                          <textarea
                            value={editedAnswer}
                            onChange={(e) => setEditedAnswer(e.target.value)}
                            rows={3}
                            style={{ width: '100%' }}
                          />
                          <input
                            type="file"
                            onChange={(e) => fileChangedHandler(e, setEditedAnswerImage)}
                            disabled={loading}
                          />
                        </>
                      ) : (
                        <h2>{card.answer}</h2>
                      )}
                      {card.answerImage && <img src={card.answerImage} alt="Answer" />}
                    </div>
                  </div>
                  <div className='edit'>
                    {isOwner && (
                      <FaEdit onClick={() => handleEditClick(card)} className='edit-icon' style={{ cursor: 'pointer', color: 'grey', height: '30px', width: '30px' }} />
                    )}
                    {editingCardId === card.id && (
                      <button onClick={() => handleSave(card.id)} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No cards in this deck</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Cards;