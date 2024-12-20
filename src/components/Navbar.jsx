import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../configs/firebaseConfig";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import pclogo from "../assets/pclogo.png";
import mobilelogo from "../assets/mobilelogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faSmile,
  faBell,
  faSearch,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";
import "../styles/navBar.css";

const NavBar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if the current user is an admin
  useEffect(() => {
    const checkUserRole = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
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
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkUserRole();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchNotifications = () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
  
      const notificationsRef = collection(db, "notifications");
      const q = query(notificationsRef, where("userId", "==", userId));
  
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedNotifications = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(fetchedNotifications);
      });
  
      // Clean up the listener on unmount
      return unsubscribe;
    };
  
    fetchNotifications();
  }, []);

  const handleReadAll = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const notificationsRef = collection(db, "notifications");
      const q = query(notificationsRef, where("userId", "==", userId), where("read", "==", false));

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        const docRef = doc(db, "notifications", docSnap.id);
        updateDoc(docRef, { read: true }); // Mark notification as read
      });

      setNotifications([]); // Clear the displayed notifications
      setShowNotifications(false); // Close the dropdown after marking as read
    } catch (error) {
      console.error("Error marking notifications as read:", error);
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
          <Link to="/home">
            <img src={pclogo} alt="Logo" className="logo-pc" />
            <img src={mobilelogo} alt="Logo" className="logo-mobile" />
          </Link>
        </div>

        {auth.currentUser ? (
          <>
            {isAdmin ? (
              // Admin View
              <div className="navbar-links">
                <button className="navbar-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              // Regular User View
              <>
                <div className="navbar-links">
                <Link to="/home" className="navbar-link">
                    <FontAwesomeIcon icon={faHouse} />
                    <span className="nav-words"> Home</span>
                  </Link>
                  <Link to="/chatmenu" className="navbar-link">
                    <FontAwesomeIcon icon={faComment} />
                    <span className="nav-words"> Chat</span>
                  </Link>
                  <Link to="/mood-tracker" className="navbar-link">
                    <FontAwesomeIcon icon={faSmile} />
                    <span className="nav-words"> Mood Tracker</span>
                  </Link>
                  <div className="notifications">
                   
                     <button onClick={() => setShowNotifications(!showNotifications)} className = "notifications-button">
                        <FontAwesomeIcon icon={faBell} /> ({notifications.length})
                      </button>
                 
                    {showNotifications && (
                      <div className="notifications-dropdown">
                        <button onClick={handleReadAll} className="read-all-button">
                            Read All
                        </button>
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="notification-item"
                            >
                              {notification.message}
                            </div>
                          ))
                        ) : (
                          <div className="no-notifications">
                            No notifications
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button className="navbar-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          // Guest View
          <div className="navbar-links">
            Login 
          </div>
        )}

        {/* Mobile Menu Toggle */}
        {/* <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            ☰
          </button>
          {isMobileMenuOpen && (
            <div className="mobile-menu-items">
              {auth.currentUser ? (
                isAdmin ? (
                  <Link to="/admin" className="mobile-link">
                    Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/chatmenu" className="mobile-link">
                      Chat
                    </Link>
                    <Link to="/mood-tracker" className="mobile-link">
                      Mood Tracker
                    </Link>
                    <button className="mobile-logout" onClick={handleLogout}>
                      Logout
                    </button>
                  </>
                )
              ) : (
                <Link to="/login" className="mobile-link">
                  Login
                </Link>
              )}
            </div>
          )}
        </div> */}
      </div>
    </nav>
  );
};

export default NavBar;
