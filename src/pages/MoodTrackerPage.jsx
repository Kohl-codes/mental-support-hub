import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../configs/firebaseConfig";
import "../styles/moodTracker.css";
import "../styles/modal.css";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import happyImage from "../assets/happy.png";
import sadImage from "../assets/sad.png";
import angryImage from "../assets/angry.png";
import calmImage from "../assets/calm.png";
import anxiousImage from "../assets/anxious.png";
import tiredImage from "../assets/tired.png";

const moods = [
  {
    id: 1,
    label: "Happy",
    value: "happy",
    color: "#ffeb6a",
    image: happyImage,
  },
  {
    id: 2,
    label: "Sad",
    value: "sad",
    color: "#999cff",
    image: sadImage,
  },
  {
    id: 3,
    label: "Angry",
    value: "angry",
    color: "#ff999e",
    image: angryImage,
  },
  {
    id: 4,
    label: "Calm",
    value: "calm",
    color: "#b0ff99",
    image: calmImage,
  },
  {
    id: 5,
    label: "Anxious",
    value: "anxious",
    color: "#ffd999",
    image: anxiousImage,
  },
  {
    id: 6,
    label: "Tired",
    value: "tired",
    color: "#efa0ff",
    image: tiredImage,
  },
];

const MoodTrackerPage = () => {
  const [selectedMood, setSelectedMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);

  const moodsRef = collection(db, "moods");

  // Fetch the mood history of the logged-in user
  useEffect(() => {
    const q = query(moodsRef, where("userId", "==", auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setMoodHistory(history);
    });

    return () => unsubscribe();
  }, []);

  // Handle mood selection
  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setLoading(true);

    try {
      // Save the mood to Firestore
      await addDoc(moodsRef, {
        mood: mood.value,
        moodLabel: mood.label,
        color: mood.color,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid, // Save the user ID
      });
      setLoading(false);
    } catch (error) {
      console.error("Error saving mood: ", error);
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      {/* Navbar at the top */}
      <Navbar />

      <div className="content-with-sidebar">
        {/* Sidebar on the left */}
        <a href="#id01" className="profile-btn">
          Profile
        </a>

        <div id="id01" className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <header className="container">
                <a href="#" className="closebtn">
                  ×
                </a>
                <h2>Profile</h2>
              </header>
              <div className="container">
                <Sidebar />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="main-content-1">
          <div>
            <h1>How are you feeling today?</h1>

            <div className="mood-selection">
              {moods.map((mood) => (
                <button
                  key={mood.id}
                  className={`mood-button ${
                    selectedMood === mood ? "selected" : ""
                  }`}
                  style={{ backgroundColor: mood.color }}
                  onClick={() => handleMoodSelect(mood)}
                  disabled={loading}
                >
                  <img src={mood.image} className="img-fluid" />
                  <div className="mood-label">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="loading-message">Saving your mood...</p>}

          <div className="mood-history">
            <h2>Mood History</h2>
            <ul className="mood-history-list">
              {moodHistory.map((entry) => (
                <li
                  key={entry.id}
                  className="mood-history-item"
                  style={{ backgroundColor: entry.color }}
                >
                  {entry.moodLabel} -{" "}
                  {new Date(
                    entry.createdAt?.seconds * 1000
                  ).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTrackerPage;
