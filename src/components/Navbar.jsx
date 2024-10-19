import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../configs/firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import pclogo from "../assets/pclogo.png";
import mobilelogo from "../assets/mobilelogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faComment,
  faSmile,
  faBell,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/navBar.css";

const NavBar = ({ setSearchResults, setCreatingPost }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      try {
        const notificationsRef = collection(db, "notifications");
        const q = query(notificationsRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        const fetchedNotifications = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications: ", error);
      }
    };

    fetchNotifications();
  }, []);

  // Handle search functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;

    try {
      const postsRef = collection(db, "forums");
      const q = query(postsRef, where("content", ">=", searchQuery));
      const querySnapshot = await getDocs(q);

      const searchResults = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSearchResults(searchResults);
      setSearchQuery("");
    } catch (error) {
      console.error("Error searching posts: ", error);
    }
  };

  // Handle logout and navigate to the login page
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase auth
      navigate("/"); // Navigate to the login page (AuthPage)
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <Link to="/">
            <img src={pclogo} alt="Logo" className="logo-pc" />
            <img src={mobilelogo} alt="Logo" className="logo-mobile" />
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
          <button type="submit" className="search-button">
            <FontAwesomeIcon icon={faSearch} className="faSearch" />
          </button>
        </form>

        {/* New post button */}
        {/* <button
          className="navbar-newpost"
          onClick={() => setCreatingPost(true)}
        >
          <FontAwesomeIcon icon={faPlus} className="faPlus" />
          <div className="nav-words">New</div>
        </button> */}

        {/* Links */}
        <div className={`navbar-links ${isMobileMenuOpen ? "open" : ""}`}>
          <Link to="/chatmenu" className="navbar-link">
            <FontAwesomeIcon icon={faComment} className="faComment" />
            <div className="nav-words">Chat</div>
          </Link>
          <Link to="/mood-tracker" className="navbar-link">
            <FontAwesomeIcon icon={faSmile} className="faSmile" />
            <div className="nav-words">Mood Tracker</div>
          </Link>
        </div>

        {/* Notifications */}
        <div className="notifications">
          <button
            onClick={toggleNotifications}
            className="notifications-button"
          >
            <FontAwesomeIcon icon={faBell} className="faBell" /> (
            {notifications.length})
          </button>
          {showNotifications && (
            <div className="notifications-dropdown">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} className="notification-item">
                    {notification.message}
                  </div>
                ))
              ) : (
                <div className="no-notifications">No notifications</div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          <FontAwesomeIcon icon={faBars} className="faBars" />
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
