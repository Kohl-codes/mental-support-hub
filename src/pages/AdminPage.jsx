import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../configs/firebaseConfig";
import "../styles/admin.css";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [forums, setForums] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalForums, setTotalForums] = useState(0);

  // Fetch all users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userCollection = collection(db, "users");
        const userSnapshot = await getDocs(userCollection);
        const userList = userSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
        setTotalUsers(userList.length);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch all forums from Firebase
  useEffect(() => {
    const fetchForums = async () => {
      try {
        const forumCollection = collection(db, "forums");
        const forumSnapshot = await getDocs(forumCollection);
        const forumList = forumSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setForums(forumList);
        setTotalForums(forumList.length);
      } catch (error) {
        console.error("Error fetching forums:", error);
      }
    };
    fetchForums();
  }, []);

  // Delete a user
  const handleDeleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter((user) => user.id !== userId));
      setTotalUsers(totalUsers - 1);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Promote user to admin
  const handlePromoteUser = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: "admin" });
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: "admin" } : user
        )
      );
    } catch (error) {
      console.error("Error promoting user:", error);
    }
  };

  // Delete a forum post
  const handleDeleteForum = async (forumId) => {
    try {
      await deleteDoc(doc(db, "forums", forumId));
      setForums(forums.filter((forum) => forum.id !== forumId));
      setTotalForums(totalForums - 1);
    } catch (error) {
      console.error("Error deleting forum:", error);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="admin-page">
        <h1>Admin Dashboard</h1>

        {/* Basic Stats */}
        <div className="stats">
          <div className="stat-card">
            <p>Total Users</p>
            <h3>{totalUsers}</h3>
          </div>
          <div className="stat-card">
            <p>Total Forums</p>
            <h3>{totalForums}</h3>
          </div>
        </div>

        {/* User Management */}
        <div className="user-management">
          <h2>Manage Users</h2>
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="user-card">
                <p>
                  <strong>{user.username}</strong> ({user.email}) -{" "}
                  {user.role === "admin" ? "Admin" : "User"}
                </p>
                <div className="user-actions">
                  <button onClick={() => handleDeleteUser(user.id)}>
                    <FontAwesomeIcon icon={faTrash} className="faEllipsis" />
                  </button>
                  {user.role !== "admin" && (
                    <button onClick={() => handlePromoteUser(user.id)}>
                      Promote to Admin
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No users found.</p>
          )}
        </div>

        {/* Forum Management */}
        <div className="forum-management">
          <h2>Manage Forums</h2>
          {forums.length > 0 ? (
            forums.map((forum) => (
              <div key={forum.id} className="forum-card">
                <p>
                  <strong>{forum.title}</strong> - Posted by {forum.author}
                </p>
                <button onClick={() => handleDeleteForum(forum.id)}>
                  <FontAwesomeIcon icon={faTrash} className="faEllipsis" />
                </button>
              </div>
            ))
          ) : (
            <p>No forums found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
