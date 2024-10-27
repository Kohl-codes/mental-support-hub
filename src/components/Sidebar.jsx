import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../configs/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
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
  const [allUsers, setAllUsers] = useState([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserProfile(user.uid);
        fetchAllUsers(user.uid);
      } else {
        setUserProfile({});
        setAllUsers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const displayName = user.displayName || "Anonymous";
        const photoURL = user.photoURL || defaultProfilePic;
        const userRef = collection(db, "users");
        const q = query(userRef, where("uid", "==", userId));
        const querySnapshot = await getDocs(q);
        const userData = querySnapshot.docs[0]?.data() || {};

        setUserProfile({
          ...userData,
          uid: userId,
          username: userData.username || displayName,
          photoURL: userData.photoURL || photoURL,
        });
        setNewBio(userData.bio || "");
        setFriends(userData.friends || []);
        setFriendRequests(userData.friendRequests || []);
      }
    } catch (error) {
      console.error("Error fetching user profile: ", error);
    }
  };

  const fetchAllUsers = async (currentUserId) => {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRefS);
      const users = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((user) => user.uid !== currentUserId);
      setAllUsers(users);
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

  // Send friend request
  const handleAddFriend = async (friendId) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    try {
      const friendRef = doc(db, "users", friendId);
      const friendDoc = await getDoc(friendRef);

      if (friendDoc.exists()) {
        const friendRequests = friendDoc.data().friendRequests || [];

        // Add current user ID to friend’s request list
        await updateDoc(friendRef, {
          friendRequests: [...friendRequests, currentUserId],
        });
      }
    } catch (error) {
      console.error("Error sending friend request: ", error);
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (requesterId) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    try {
      const currentUserRef = doc(db, "users", currentUserId);
      const requesterRef = doc(db, "users", requesterId);

      // Get the current user's document and requester's document
      const currentUserDoc = await getDoc(currentUserRef);
      const requesterDoc = await getDoc(requesterRef);

      if (currentUserDoc.exists() && requesterDoc.exists()) {
        const currentUserFriends = currentUserDoc.data().friends || [];
        const requesterFriends = requesterDoc.data().friends || [];
        const currentUserRequests = currentUserDoc.data().friendRequests || [];

        // Add each user to the other’s friend list and remove the friend request
        await updateDoc(currentUserRef, {
          friends: [...currentUserFriends, requesterId],
          friendRequests: currentUserRequests.filter((id) => id !== requesterId),
        });
        await updateDoc(requesterRef, {
          friends: [...requesterFriends, currentUserId],
        });

        setFriends((prevFriends) => [...prevFriends, requesterId]);
        setFriendRequests((prevRequests) =>
          prevRequests.filter((id) => id !== requesterId)
        );
      }
    } catch (error) {
      console.error("Error accepting friend request: ", error);
    }
  };

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
          src={userProfile.photoURL}
          alt="User Profile"
          className="profile-picture"
        />
        <div className="bio">
          <h3>{userProfile.username}</h3>
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

      {/* Add Friends Section */}
      <div className="add-friends">
        <h4>Add Friends</h4>
        {allUsers.length > 0 ? (
          allUsers.map((user) => (
            <div key={user.uid} className="user-item">
              <p>{user.username || user.displayName || "Anonymous"}</p>
              {friends.includes(user.uid) ? (
                <button disabled className="friend-btn">
                  Friends
                </button>
              ) : (
                <button onClick={() => handleAddFriend(user.uid)} className="add-friend-btn">
                  Add Friend
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No users available</p>
        )}
      </div>

      {/* Friend Requests Section */}
      <div className="friend-requests">
        <h4>Friend Requests</h4>
        {friendRequests.length > 0 ? (
          friendRequests.map((requesterId) => {
            const requester = allUsers.find((user) => user.uid === requesterId);
            return (
              <div key={requesterId} className="user-item">
                <p>{requester?.username || requester?.displayName || "Unknown User"}</p>
                <button onClick={() => handleAcceptRequest(requesterId)} className="accept-friend-btn">
                  Accept
                </button>
              </div>
            );
          })
        ) : (
          <p>No friend requests</p>
        )}
      </div>

      {/* Friend List Section */}
      <div className="friend-list">
        <h4>Your Friends</h4>
        {friends.length > 0 ? (
          friends.map((friendId) => {
            const friend = allUsers.find((user) => user.uid === friendId);
            return (
              <div key={friendId} className="user-item">
                <p>{friend?.username || friend?.displayName || "Unknown Friend"}</p>
              </div>
            );
          })
        ) : (
          <p>You have no friends yet.</p>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
