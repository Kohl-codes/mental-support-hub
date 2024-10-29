import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../configs/firebaseConfig";
import "../styles/admin.css";
import Navbar from "../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import ReportModal from "../components/ReportModal"; 
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [forums, setForums] = useState([]);
  const [reports, setReports] = useState([]); // State for reported posts
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalForums, setTotalForums] = useState(0);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); // State for report modal
  const [selectedPostId, setSelectedPostId] = useState(null); // State for selected post ID for reporting

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
        setTotalUsers(userList.length); // Set total users
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
        setTotalForums(forumList.length); // Set total forums
      } catch (error) {
        console.error("Error fetching forums:", error);
      }
    };
    fetchForums();
  }, []);

  // Fetch all reports from Firebase
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportCollection = collection(db, "reports");
        const reportSnapshot = await getDocs(reportCollection);
        const reportList = reportSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportList);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };
    fetchReports();
  }, []);

  // Delete a user
  const handleDeleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter((user) => user.id !== userId));
      setTotalUsers(totalUsers - 1); // Update total users count
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // Delete a forum post
  const handleDeleteForum = async (forumId) => {
    try {
      await deleteDoc(doc(db, "forums", forumId));
      setForums(forums.filter((forum) => forum.id !== forumId));
      setTotalForums(totalForums - 1); // Update total forums count
    } catch (error) {
      console.error("Error deleting forum:", error);
    }
  };

  // Delete a reported post and the corresponding forum post
  const handleDeleteReport = async (reportId, postId) => {
    try {
      // Delete the report from the "reports" collection
      await deleteDoc(doc(db, "reports", reportId));
      setReports(reports.filter((report) => report.id !== reportId));

      // Delete the associated forum post from the "forums" collection
      await deleteDoc(doc(db, "forums", postId));
      setForums(forums.filter((forum) => forum.id !== postId));
      setTotalForums(totalForums - 1); // Update total forums count
    } catch (error) {
      console.error("Error deleting report or forum post:", error);
    }
  };

  // Give warning to user
  const handleGiveWarning = async (report) => {
    if (!report.postId || !report.reason) {
      console.error("Error: Incomplete report data:", report);
      return;
    }
  
    try {
      // Fetch post to get userId
      const postRef = doc(db, "forums", report.postId);
      const postSnap = await getDoc(postRef); // Use getDoc for a single document
  
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const userId = postData.userId; // Assuming the post has a 'userId' field
  
        if (!userId) {
          console.error("Error: userId not found in post data:", postData);
          return;
        }
  
        // Add warning notification to the user
        await addDoc(collection(db, "notifications"), {
          userId,
          message: `Your post has been reported for "${report.reason}". Please address it within the next hour to avoid automatic deletion.`,
          timestamp: serverTimestamp(),
        });
  
        setTimeout(async () => {
          await deleteDoc(postRef);
          setReports((prevReports) => prevReports.filter((rep) => rep.postId !== report.postId));
        }, 3600000); // 1 hour
  
        // Show toast notification on successful warning send
        toast.success("Successfully sent warning to the original poster.");
      } else {
        console.error("Error: Post not found:", report.postId);
      }
    } catch (error) {
      console.error("Error giving warning:", error);
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
          {users.filter(user => user.role !== "admin").length > 0 ? (
            users
              .filter(user => user.role !== "admin") // Exclude admins
              .map(user => (
                <div key={user.id} className="user-card">
                  <p>
                    <strong>{user.username}</strong> ({user.email}) - User
                  </p>
                  <div className="user-actions">
                    <button onClick={() => handleDeleteUser(user.id)}>
                      <FontAwesomeIcon icon={faTrash} className="faEllipsis" />
                    </button>
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

        {/* Reported Posts Management */}
        <div className="report-management">
          <h2>Reported Posts</h2>
          {reports.length > 0 ? (
            reports.map((report) => (
              <div key={report.id} className="report-card">
                <p>
                  Post ID: {report.postId} - Reason: {report.reason}
                </p>
                <div className="report-actions">
                  <button onClick={() => handleGiveWarning(report)}>
                    <FontAwesomeIcon icon={faExclamationTriangle} /> Give Warning
                  </button>
                  <button onClick={() => handleDeleteReport(report.id, report.postId)}>
                    <FontAwesomeIcon icon={faTrash} className="faEllipsis" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No reports found.</p>
          )}
        </div>

        {/* Report Modal */}
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          postId={selectedPostId} // Pass the selected post ID to the modal
        />
      </div>
    </div>
  );
};

export default AdminPage;
