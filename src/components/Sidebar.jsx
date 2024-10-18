import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../configs/firebaseConfig";
import defaultProfilePic from "../assets/defaultPic.jpg";
import "../styles/sidebar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faXmark } from "@fortawesome/free-solid-svg-icons";

const Sidebar = () => {
  const [userProfile, setUserProfile] = useState({
    uid: "",
    username: "",
    bio: "",
    photoURL: "",
  });
  const [recentChats, setRecentChats] = useState([]);
  const [recentForums, setRecentForums] = useState([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");

  // Fetch user profile data from Firebase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // If user logs in using Google, retrieve displayName and photoURL directly from auth
          const username = user.displayName || "Anonymous";
          const photoURL = user.photoURL || defaultProfilePic;

          // Fetch additional user profile info from Firestore
          const userRef = collection(db, "users");
          const q = query(userRef, where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);

          const userData = querySnapshot.docs[0]?.data() || {};

          setUserProfile({
            ...userData,
            uid: user.uid,
            username: userData.username || username, // Use username from Firestore or fallback to displayName from auth
            photoURL: userData.photoURL || photoURL, // Use photoURL from Firestore or fallback to photoURL from auth
          });

          setNewBio(userData.bio || "");
        }
      } catch (error) {
        console.error("Error fetching user profile: ", error);
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch recent chats from Firebase (Limit to 5)
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, limit(5)); // Limit the result to 5 chats
        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentChats(chats);
      } catch (error) {
        console.error("Error fetching recent chats: ", error);
      }
    };
    fetchRecentChats();
  }, []);

  // Fetch recent forums from Firebase (Limit to 5)
  useEffect(() => {
    const fetchRecentForums = async () => {
      try {
        const forumsRef = collection(db, "forums");
        const q = query(forumsRef, limit(5)); // Limit the result to 5 forums
        const querySnapshot = await getDocs(q);
        const forums = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentForums(forums);
      } catch (error) {
        console.error("Error fetching recent forums: ", error);
      }
    };
    fetchRecentForums();
  }, []);

  const handleEditBioClick = () => {
    setIsEditingBio(!isEditingBio);
  };

  const handleBioChange = (event) => {
    setNewBio(event.target.value);
  };

  const handleSaveBio = async () => {
    if (!userProfile.uid) {
      console.error("User profile data not available yet.");
      return;
    }

    try {
      const userRef = doc(db, "users", userProfile.uid);
      await updateDoc(userRef, { bio: newBio });
      setUserProfile((prevProfile) => ({ ...prevProfile, bio: newBio }));
      setIsEditingBio(false);
    } catch (error) {
      console.error("Error saving bio: ", error);
    }
  };

  return (
    <div className="sidebar">
      {/* Profile Section */}
      <div className="profile-section">
        <img
          src={userProfile.photoURL} // Use the fetched 'photoURL'
          alt="User Profile"
          className="profile-picture"
        />
        <div className="bio">
          <h3>{userProfile.username}</h3> {/* Use the fetched 'username' */}
          <button onClick={handleEditBioClick}>
            {isEditingBio ? (
              <FontAwesomeIcon icon={faXmark} className="bio-icons" />
            ) : (
              <FontAwesomeIcon icon={faEdit} className="bio-icons" />
            )}
          </button>
        </div>
        {isEditingBio ? (
          <div className="bio-edit-container">
            <textarea
              value={newBio}
              onChange={handleBioChange}
              placeholder="Enter your bio"
            />
            <button onClick={handleSaveBio}>Save</button>
          </div>
        ) : (
          <p>{userProfile.bio || "No bio available."}</p>
        )}
      </div>

      {/* Recent Chats Section */}
      <div className="recent-chats">
        <h4>Recent Chats</h4>
        {recentChats.length > 0 ? (
          recentChats.map((chat) => (
            <div key={chat.id} className="chat-item">
              <p>{chat.title}</p>
            </div>
          ))
        ) : (
          <p>No Recent Chats</p>
        )}
      </div>

      {/* Recent Forums Section */}
      <div className="recent-forums">
        <h4>Recent Forums</h4>
        {recentForums.length > 0 ? (
          recentForums.map((forum) => (
            <div key={forum.id} className="forum-item">
              <p>{forum.title}</p>
            </div>
          ))
        ) : (
          <p>No Forums Yet</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
