import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../configs/firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import "../styles/navBar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { faComment } from "@fortawesome/free-solid-svg-icons";
import { faSmile } from "@fortawesome/free-solid-svg-icons";
import pclogo from "../assets/pclogo.png";

const NavBar = ({ setSearchResults, setCreatingPost }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Handle search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;

    try {
      // Query the posts collection in Firestore to match the search query
      const postsRef = collection(db, "forums");
      const q = query(postsRef, where("content", ">=", searchQuery));
      const querySnapshot = await getDocs(q);

      const searchResults = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSearchResults(searchResults);
      setSearchQuery(""); // Clear the search input
    } catch (error) {
      console.error("Error searching posts: ", error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // Redirect to login page after successful logout
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div>
        <Link to="/">
          <img src={pclogo} alt="Logo" className="navbar-logo" />
        </Link>
      </div>

      {/* Search bar */}
      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search forums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">
          <FontAwesomeIcon icon={faSearch} className="faSearch" />
        </button>
      </form>

      {/* New post button */}
      <button
        className="navbar-newpost"
        onClick={() => setCreatingPost(true)} // Set state to show the post creation form
      >
        <FontAwesomeIcon icon={faPlus} className="faPlus" /> New
      </button>

      {/* Links to ChatPage and MoodTracker */}
      <div className="navbar-links">
        <Link to="/chat" className="navbar-link">
          <FontAwesomeIcon icon={faComment} className="faComment" />
          Chat with Someone
        </Link>
        <Link to="/mood-tracker" className="navbar-link">
          <FontAwesomeIcon icon={faSmile} className="faSmile" />
          Mood Tracker
        </Link>
      </div>

      {/* Logout button */}
      <button className="navbar-logout" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
};

export default NavBar;
