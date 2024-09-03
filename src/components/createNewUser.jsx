import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';

const CreateUserForm = ({ setIsCreatingAccount, setIsSignedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const createAccount = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set the display name
      await updateProfile(user, { displayName: username });

      // Re-fetch the user to ensure displayName is updated
      const updatedUser = auth.currentUser;

      console.log('User created with username:', updatedUser.displayName);

      setIsSignedIn(true); // Update sign-in status
      setErrorMessage('');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err) => {
    const { code, message } = err;
    switch (code) {
      case 'auth/email-already-in-use':
        setErrorMessage('Email address is already in use.');
        break;
      case 'auth/weak-password':
        setErrorMessage('Password should be at least 6 characters.');
        break;
      default:
        setErrorMessage('Error: ' + message);
        break;
    }
  };

  return (
    <form onSubmit={createAccount}>
      <input
        type="text"
        placeholder='Username...'
        onChange={(e) => setUsername(e.target.value)}
        value={username}
        required
      />
      <input
        type="text"
        placeholder='Email...'
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        required
      />
      <input
        type="password"
        placeholder='Password...'
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        required
      />
      <button type='submit' disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
      <p>Already have an account? <span onClick={() => setIsCreatingAccount(false)}>Sign in here</span></p>
      {errorMessage && <p>{errorMessage}</p>}
    </form>
  );
};

export default CreateUserForm;
