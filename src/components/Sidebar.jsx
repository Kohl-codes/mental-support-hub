import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from "../configs/firebaseConfig";
import defaultProfilePic from '../assets/defaultPic.jpg'; 
import '../styles/sidebar.css';  

const Sidebar = () => {
  const [userProfile, setUserProfile] = useState({});
  const [recentChats, setRecentChats] = useState([]);
  const [recentForums, setRecentForums] = useState([]);

  // Fetch user profile data from Firebase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = collection(db, 'users');
          const q = query(userRef, where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const userData = querySnapshot.docs[0]?.data() || {};
          setUserProfile(userData);
        }
      } catch (error) {
        console.error('Error fetching user profile: ', error);
      }
    };
    fetchUserProfile();
  }, []);

  // Fetch recent chats from Firebase
  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const chatsRef = collection(db, 'chats');
        const querySnapshot = await getDocs(chatsRef);
        const chats = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentChats(chats);
      } catch (error) {
        console.error('Error fetching recent chats: ', error);
      }
    };
    fetchRecentChats();
  }, []);

  // Fetch recent forums from Firebase
  useEffect(() => {
    const fetchRecentForums = async () => {
      try {
        const forumsRef = collection(db, 'forums');
        const querySnapshot = await getDocs(forumsRef);
        const forums = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentForums(forums);
      } catch (error) {
        console.error('Error fetching recent forums: ', error);
      }
    };
    fetchRecentForums();
  }, []);

  return (
    <div className="sidebar">
      {/* Profile Section */}
      <div className="profile-section">
        <img
          src={userProfile.photoURL || defaultProfilePic}
          alt="User Profile"
          className="profile-picture"
        />
        <h3>{userProfile.username || 'Anonymous'}</h3>
        <p>{userProfile.bio || 'No bio available.'}</p>
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
