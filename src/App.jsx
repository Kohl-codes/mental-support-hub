import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./configs/firebaseConfig";
import { FaSignOutAlt } from "react-icons/fa";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import ChatMenuPage from "./pages/ChatMenuPage";
import ForumPage from "./pages/ForumPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import AdminPage from "./pages/AdminPage";
import Cookies from "universal-cookie";
import "./App.css";

const cookies = new Cookies();

function App() {
  const [isAuth, setIsAuth] = useState(cookies.get("auth-token"));
  const [room, setRoom] = useState(localStorage.getItem("currentRoom") || null);

  const signUserOut = async () => {
    await signOut(auth);
    cookies.remove("auth-token");
    setIsAuth(false);
    setRoom(null);
    localStorage.removeItem("currentRoom");
  };

  useEffect(() => {
    const isUserLoggedIn = localStorage.getItem("isUserLoggedIn");
    if (isUserLoggedIn) {
      setIsAuth(true);
    }

    localStorage.setItem("currentRoom", room);
  }, [room]);

  const handleAuthSuccess = () => {
    localStorage.setItem("isUserLoggedIn", "true");
  };

  return (
    <Router>
      <Routes>
        {/* Always show AuthPage on root */}
        <Route
          path="/"
          element={
            <AuthPage
              setIsAuth={setIsAuth}
              handleAuthSuccess={handleAuthSuccess}
            />
          }
        />

        {/* Other routes */}
        <Route
          path="/home"
          element={
            isAuth ? <HomePage setRoom={setRoom} /> : <Navigate to="/" />
          }
        />
        <Route
          path="/chat"
          element={
            isAuth && room ? (
              <ChatPage room={room} />
            ) : (
              <Navigate to="/chatmenu" />
            )
          }
        />
        <Route
          path="/chatmenu"
          element={
            isAuth ? <ChatMenuPage setRoom={setRoom} /> : <Navigate to="/" />
          }
        />
        <Route
          path="/forum"
          element={isAuth ? <ForumPage /> : <Navigate to="/" />}
        />
        <Route
          path="/mood-tracker"
          element={isAuth ? <MoodTrackerPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={isAuth ? <AdminPage /> : <Navigate to="/" />}
        />
      </Routes>

      {isAuth && <LogoutButton signUserOut={signUserOut} />}
    </Router>
  );
}

function LogoutButton({ signUserOut }) {
  const location = useLocation();
  const showLogoutButton = !["/"].includes(location.pathname); // Show logout button only when not on AuthPage

  return showLogoutButton ? (
    <div className="sign-out">
      <button onClick={signUserOut} className="logout-button">
        <FaSignOutAlt />
      </button>
    </div>
  ) : null;
}

export default App;
