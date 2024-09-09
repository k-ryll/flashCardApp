import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../config/firebase';
import CreateUserForm from '../components/createNewUser'; // Import the CreateUserForm component
import '../styles/signup.css'

const SignupPage = ({ setIsSignedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
    });

    return () => unsubscribe();
  }, [setIsSignedIn]);

  const handleGoogleSignUp = async (e) => {
    e.preventDefault();
    const provider = new GoogleAuthProvider();
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      console.log('User signed in with Google:', result.user);
      setErrorMessage('');
      setIsSignedIn(true);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in');
      setIsSignedIn(true);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (err) => {
    const { code, message } = err;
    switch (code) {
      case 'auth/wrong-password':
        setErrorMessage('Incorrect password. Please try again.');
        break;
      case 'auth/user-not-found':
        setErrorMessage('No account found with this email. Please sign up.');
        break;
      case 'auth/invalid-email':
        setErrorMessage('The email address is not valid.');
        break;
      case 'auth/invalid-credential':
        setErrorMessage('Incorrect Email or Password');
        break;
      default:
        setErrorMessage('Error: ' + message);
        break;
    }
  };

  return (
    <div className='signupContainer'>
    
      {isCreatingAccount ? (
        <CreateUserForm setIsCreatingAccount={setIsCreatingAccount} setIsSignedIn={setIsSignedIn} />
      ) : (
        <form onSubmit={signIn} className='signupForm'>
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <button onClick={handleGoogleSignUp} disabled={loading} className='googleSignin'>
            <img src="google.png" alt="Google logo" className='googleLogo'/>
            {loading ? 'Signing Up...' : 'Continue with Google'}
          </button>
          <p>Don't have an account? <span onClick={() => setIsCreatingAccount(true)}>Sign up here</span></p>
          {errorMessage && <p>{errorMessage}</p>}
        </form>
      )}
    </div>
  );
};

export default SignupPage;
