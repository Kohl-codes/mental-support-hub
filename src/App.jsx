import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useState, useEffect } from "react";
import { signOut } from 'firebase/auth'; 
import { auth } from "./configs/firebaseConfig"; 
import { FaSignOutAlt } from "react-icons/fa";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import ChatMenuPage from "./pages/ChatMenuPage"; 
import ForumPage from "./pages/ForumPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import AdminPage from "./pages/AdminPage";
import Cookies from "universal-cookie";  // Correct import
import "./App.css";

// Initialize cookies instance
const cookies = new Cookies();

function App() {
  const [isAuth, setIsAuth] = useState(cookies.get("auth-token"));
  const [room, setRoom] = useState(localStorage.getItem("currentRoom") || null);

  const signUserOut = async () => {
    await signOut(auth);  
    cookies.remove("auth-token");  // Correct cookies usage
    setIsAuth(false);
    setRoom(null);
    localStorage.removeItem("currentRoom");
  };

  useEffect(() => {
    localStorage.setItem("currentRoom", room);
  }, [room]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuth ? <HomePage setRoom={setRoom} /> : <AuthPage setIsAuth={setIsAuth} />} />
        <Route path="/chat" element={isAuth && room ? <ChatPage room={room} /> : <ChatMenuPage setRoom={setRoom} />} />
        <Route path="/chatmenu" element={isAuth ? <ChatMenuPage setRoom={setRoom} /> : <AuthPage setIsAuth={setIsAuth} />} />
        <Route path="/forum" element={isAuth ? <ForumPage /> : <AuthPage setIsAuth={setIsAuth} />} />
        <Route path="/mood-tracker" element={isAuth ? <MoodTrackerPage /> : <AuthPage setIsAuth={setIsAuth} />} />
        <Route path="/admin" element={isAuth ? <AdminPage /> : <AuthPage setIsAuth={setIsAuth} />} />
      </Routes>
      {isAuth && <LogoutButton signUserOut={signUserOut} />}  {/* Display Logout button */}
    </Router>
  );
}

function LogoutButton({ signUserOut }) {
  const location = useLocation();
  const showLogoutButton = ["/"].includes(location.pathname);

  return showLogoutButton ? (
    <div className="sign-out">
      <button onClick={signUserOut} className="logout-button">
        <FaSignOutAlt />
      </button>
    </div>
  ) : null;
}

export default App;
