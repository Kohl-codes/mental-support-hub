import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../configs/firebaseConfig";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import pclogo from "../assets/pclogo.png";
import mobilelogo from "../assets/mobilelogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faComment, faSmile, faBell, faBars } from "@fortawesome/free-solid-svg-icons";
import "../styles/navBar.css";

const NavBar = ({ setSearchResults }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Added loading state
  const navigate = useNavigate();

  // Check if the current user is an admin
  useEffect(() => {
    const checkUserRole = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false); // No user logged in, stop loading
        return;
      }

      try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === "admin");
        }
      } catch (error) {
        console.error("Error checking user role: ", error);
      } finally {
        setLoading(false); // Finished loading
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkUserRole();
      } else {
        setLoading(false); // No user, stop loading
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch notifications for regular users
  useEffect(() => {
    const fetchNotifications = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId || isAdmin) return;

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
  }, [isAdmin]);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to login page after logout
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

  if (loading) {
    return <div>Loading...</div>; // Loading indicator while checking user role
  }

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

        {auth.currentUser ? (
          <>
            {isAdmin ? (
              /* Admin View */
              <>
                <div className="navbar-links">
                  <Link to="/admin" className="navbar-link">
                    Admin Dashboard
                  </Link>
                </div>
                <button className="navbar-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              /* Regular User View */
              <>
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

                <button className="mobile-menu-button" onClick={toggleMobileMenu}>
                  <FontAwesomeIcon icon={faBars} className="faBars" />
                </button>

                <button className="navbar-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </>
        ) : (
          /* When no user is logged in */
          <>
          <div className="navbar-links">
            <Link to="/admin" className="navbar-link">
              Admin Dashboard
            </Link>
          </div>
          <button className="navbar-logout" onClick={handleLogout}>
            Logout
          </button>
        </>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
