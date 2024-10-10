import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { auth, db } from "../configs/firebaseConfig";
import "../styles/forum.css";

const ForumPage = () => {
  const [userForums, setUserForums] = useState([]);
  const [allForums, setAllForums] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const forumsRef = collection(db, "forums");

  // Fetch user's forums first
  useEffect(() => {
    const q = query(forumsRef, where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const forums = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUserForums(forums);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch all forums (for the search functionality)
  useEffect(() => {
    const q = query(forumsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const forums = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllForums(forums);
    });

    return () => unsubscribe();
  }, []);

  // Filter forums based on the search term
  const filteredForums = allForums.filter((forum) =>
    forum.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    forum.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="forum-page-container">
      <h1>Your Forums</h1>
      {loading ? (
        <p>Loading your forums...</p>
      ) : userForums.length === 0 ? (
        <p>You have not posted any forums yet.</p>
      ) : (
        <div className="forums-list">
          {userForums.map((forum) => (
            <div key={forum.id} className="forum-item">
              <h2>{forum.title}</h2>
              <p>{forum.description}</p>
              <p className="forum-date">{new Date(forum.createdAt.seconds * 1000).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      <h1>All Forums</h1>
      <input
        type="text"
        placeholder="Search forums..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="forum-search-input"
      />

      <div className="forums-list">
        {filteredForums.length === 0 ? (
          <p>No forums found.</p>
        ) : (
          filteredForums.map((forum) => (
            <div key={forum.id} className="forum-item">
              <h2>{forum.title}</h2>
              <p>{forum.description}</p>
              <p className="forum-date">{new Date(forum.createdAt.seconds * 1000).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ForumPage;
