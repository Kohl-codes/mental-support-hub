// ... existing imports
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, db } from "../configs/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Cookies from "universal-cookie";
import GoogleLogo from "../assets/googleLogo.png";
import "../styles/auth.css";

const cookies = new Cookies();

const AuthPage = ({ setIsAuth, handleAuthSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Lockout mechanism
  useEffect(() => {
    if (isLockedOut) {
      const timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev === 1) {
            setIsLockedOut(false);
            setLoginAttempts(0);
            clearInterval(timer);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLockedOut]);

  // Helper to map error codes to user-friendly messages
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/user-disabled":
        return "User account has been disabled.";
      case "auth/user-not-found":
        return "No user found with this email.";
      case "auth/wrong-password":
        return "Incorrect password.";
      case "auth/email-already-in-use":
        return "Email is already in use.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

// Handle login and registration
const handleAuth = async () => {
  // Lockout check
  if (!isRegistering && isLockedOut) {
    setError(`Too many failed attempts. Please try again in ${lockoutTimer} seconds.`);
    return;
  }

  // Validation checks
  if (!email || !password || (isRegistering && (!name || !confirmPassword))) {
    setError("Please fill in all fields.");
    return;
  }

  if (password.length < 8 || password.length > 20) {
    setError("Password must be between 8 and 20 characters.");
    return;
  }

  if (isRegistering) {
    // Registration flow
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      // Check if user already exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        setError("User already exists.");
        return;
      }

      // Set admin role if this is the admin email
      await setDoc(userRef, {
        name,
        bio: "",
        profilePic: "",
        email,
        role: email === "admin@gmail.com" ? "admin" : "user",
      });

      cookies.set("auth-token", user.refreshToken);
      setIsAuth(true);
      handleAuthSuccess();
      navigate(email === "admin@gmail.com" ? "/admin" : "/home");
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
  } else {
    // Login flow
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Retrieve role from Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const role = userDoc.data().role || "user"; // Default to "user" if no role is found
        console.log("User role:", role); // Debug log for role check

        cookies.set("auth-token", user.refreshToken);
        setIsAuth(true);
        handleAuthSuccess();

        if (role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }

        // Reset login attempts after successful login
        setLoginAttempts(0);
        setIsLockedOut(false);
      } else {
        setError("User document not found.");
      }
    } catch (error) {
      setError(getErrorMessage(error.code));
      setLoginAttempts((prev) => prev + 1);

      // Lockout logic if login attempts exceed limit
      if (loginAttempts + 1 >= 3) {
        setIsLockedOut(true);
        setLockoutTimer(300); // Lock out for 5 minutes
        setError("Too many failed attempts. Locked out for 5 minutes.");
      }
    }
  }
};


  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      cookies.set("auth-token", user.refreshToken);

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      const bio = userDoc.exists() ? userDoc.data().bio : "";
      const profilePic = userDoc.exists()
        ? userDoc.data().profilePic
        : user.photoURL || "";

      await setDoc(
        userRef,
        {
          name: user.displayName || "Anonymous",
          bio: bio,
          profilePic: profilePic,
          email: user.email,
          role: user.email === "admin@gmail.com" ? "admin" : "user", // Assign role based on email
        },
        { merge: true }
      );

      setIsAuth(true);
      handleAuthSuccess();
      navigate(user.email === "admin@gmail.com" ? "/admin" : "/home");
    } catch (error) {
      setError(getErrorMessage(error.code));
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleAuth();
    }
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setError("");
  };

  const handleInputFocus = () => {
    setError("");
  };

  return (
    <div className="bg">
      <div className="register-container">
        <div className="logo"> </div>
        <h1>{isRegistering ? "Join Us" : "Sign In"}</h1>
        {isRegistering && (
          <input
            type="text"
            placeholder="Name"
            className="input-field"
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          className="input-field"
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
        />
        <input
          type="password"
          placeholder="Password"
          className="input-field"
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={handleInputFocus}
        />
        {isRegistering && (
          <input
            type="password"
            placeholder="Confirm Password"
            className="input-field"
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleInputFocus}
          />
        )}
        <div className="error-message">{error}</div>
        <button className="auth-button" onClick={handleAuth}>
          {isRegistering ? "Register" : "Login"}
        </button>
        <div className="alternative-auth">
          <button className="google-button" onClick={signInWithGoogle}>
            <img src={GoogleLogo} alt="Google Logo" className="google-logo" />
            Sign in with Google
          </button>
        </div>
        <div className="toggle-auth">
          <span>
            {isRegistering
              ? "Already have an account? "
              : "Don't have an account? "}
          </span>
          <button className="toggle-button" onClick={toggleAuthMode}>
            {isRegistering ? "Login" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
