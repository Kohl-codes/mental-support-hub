import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from "../configs/firebaseConfig";
import { signOut } from 'firebase/auth'; 
import { collection, getDocs, query, where } from 'firebase/firestore';
import pclogo from '../assets/pclogo.png'; 
import '../styles/navbar.css';  

const NavBar = ({ setSearchResults, setCreatingPost }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Handle search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;

    try {
      const postsRef = collection(db, 'forums');
      const q = query(postsRef, where('content', '>=', searchQuery));
      const querySnapshot = await getDocs(q);

      const searchResults = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setSearchResults(searchResults);
      setSearchQuery('');
    } catch (error) {
      console.error('Error searching posts: ', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <Link to="/">
            <img
          src={pclogo}
          alt="Logo"
          className="logo-image"
        />
          </Link>
        </div>

        {/* Search bar */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search forums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        {/* Links */}
        <div className="navbar-links">
          <Link to="/chat" className="navbar-link">Chat</Link>
          <Link to="/mood-tracker" className="navbar-link">Mood Tracker</Link>
        </div>

        {/* New post button */}
        <button
          className="navbar-newpost"
          onClick={() => setCreatingPost(true)}
        >
          New Post
        </button>

        {/* Logout button */}
        <button className="navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
