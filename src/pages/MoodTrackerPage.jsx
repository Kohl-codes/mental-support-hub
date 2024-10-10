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

const moods = [
  { id: 1, label: "😊 Happy", value: "happy", color: "#FFD700" },
  { id: 2, label: "😔 Sad", value: "sad", color: "#87CEFA" },
  { id: 3, label: "😡 Angry", value: "angry", color: "#FF6347" },
  { id: 4, label: "😌 Calm", value: "calm", color: "#98FB98" },
  { id: 5, label: "😟 Anxious", value: "anxious", color: "#FFA07A" },
  { id: 6, label: "😴 Tired", value: "tired", color: "#D3D3D3" },
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
    <div className="mood-tracker-container">
      <h1>How are you feeling today?</h1>

      <div className="mood-selection">
        {moods.map((mood) => (
          <button
            key={mood.id}
            className={`mood-button ${selectedMood === mood ? "selected" : ""}`}
            style={{ backgroundColor: mood.color }}
            onClick={() => handleMoodSelect(mood)}
            disabled={loading}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {loading && <p>Saving your mood...</p>}

      <h2>Mood History</h2>
      <ul className="mood-history-list">
        {moodHistory.map((entry) => (
          <li key={entry.id} className="mood-history-item">
            <span
              className="mood-history-color"
              style={{ backgroundColor: entry.color }}
            />
            {entry.moodLabel} - {new Date(entry.createdAt?.seconds * 1000).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MoodTrackerPage;
