
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../configs/firebaseConfig";
import "../styles/home.css";
import "../styles/modal.css";
import "../styles/report.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";

// ReportModal Component
const ReportModal = ({ isOpen, onClose, postId }) => {
  const [reportReason, setReportReason] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting report..."); // Debug log
    if (reportReason.trim()) {
      try {
        // Add the report to the "reports" collection in Firestore
        await addDoc(collection(db, "reports"), {
          postId: postId,
          reason: reportReason,
          timestamp: new Date(),
        });
        console.log("Report submitted successfully!"); // Debug log
        setReportReason("");
        onClose();
      } catch (error) {
        console.error("Error reporting post:", error);
      }
    } else {
      console.log("Report reason is empty."); // Debug log
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal">
      <div className="report-modal-dialog">
        <div className="report-modal-content">
          <header className="report-modal-header">
            <h2>Report Post</h2>
            <button className="closebtn" onClick={onClose}>
              ×
            </button>
          </header>
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="Reason for reporting..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <button type="submit">Submit Report</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [lovedPosts, setLovedPosts] = useState(new Set());
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState("");
  const [activitySuggestion, setActivitySuggestion] = useState("Take a deep breath and focus on your breathing.");
  const defaultProfilePic = "/path/to/default-profile-pic.png";

  // Fetch the logged-in user's profile from Firebase
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch posts from Firebase on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      const querySnapshot = await getDocs(collection(db, "forums"));
      const forums = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(forums);
    };

    fetchPosts();
  }, []);

  // Handle post creation
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (newPostContent.trim() === "" || !userProfile) return;

    try {
      const newPost = {
        author: userProfile.name || "Anonymous User",
        profilePic: userProfile.profilePic || defaultProfilePic,
        time: new Date().toLocaleTimeString(),
        content: newPostContent,
        comments: [],
        loves: 0,
        userId: auth.currentUser.uid, // Store the user ID of the poster
      };
      const docRef = await addDoc(collection(db, "forums"), newPost);
      setPosts([...posts, { id: docRef.id, ...newPost }]);
      setNewPostContent("");
    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  // Handle love button click with limitation to one love per post
  const handleLoveClick = async (postId, currentLoves) => {
    if (lovedPosts.has(postId)) return;

    const postRef = doc(db, "forums", postId);
    try {
      await updateDoc(postRef, { loves: currentLoves + 1 });
      setPosts(
        posts.map((post) =>
          post.id === postId ? { ...post, loves: currentLoves + 1 } : post
        )
      );
      setLovedPosts(new Set([...lovedPosts, postId]));
    } catch (error) {
      console.error("Error updating loves: ", error);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (postId) => {
    if (newComment.trim() === "" || !userProfile) return;

    const postRef = doc(db, "forums", postId);
    try {
      await updateDoc(postRef, {
        comments: arrayUnion({
          author: userProfile.name || "Anonymous User",
          time: new Date().toLocaleTimeString(),
          text: newComment,
        }),
      });
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: [
                  ...post.comments,
                  {
                    author: userProfile.name || "Anonymous User",
                    time: new Date().toLocaleTimeString(),
                    text: newComment,
                  },
                ],
              }
            : post
        )
      );
      setNewComment("");
      setSelectedPost(null);
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  // Handle report submit
  const handleReportSubmit = (reason) => {
    console.log(`Reported post ${reportPostId} for reason: ${reason}`);
    setIsReportModalOpen(false);
  };

  // Handle delete post
  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, "forums", postId));
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
  };

  // Handle edit post
  const handleEditPost = async (postId) => {
    if (editingContent.trim() === "") return;

    try {
      const postRef = doc(db, "forums", postId);
      await updateDoc(postRef, { content: editingContent });
      setPosts(
        posts.map((post) =>
          post.id === postId ? { ...post, content: editingContent } : post
        )
      );
      setIsEditing(false);
      setEditingContent("");
    } catch (error) {
      console.error("Error editing post: ", error);
    }
  };

  const togglePostOptions = (postId) => {
    if (openDropdownId === postId) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(postId);
      setReportPostId(postId);
    }
  };

  // Fetch activity from Mindfulness API
  const fetchActivity = async () => {
    try {
      const response = await fetch("http://mindfully-api.us-east-2.elasticbeanstalk.com/api/category/healing");
      const data = await response.json();
      setActivitySuggestion(data.activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
      setActivitySuggestion("Try a mindful breathing exercise.");
    }
  };

  return (
    <div className="home-page">
      <Navbar />
      <div className="main-content">
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

        <div className="posts-section">

          <div className="post-creation">
            <h3>Create a New Post</h3>
            <form onSubmit={handlePostSubmit}>
              <textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              ></textarea>
              <button type="submit">Post</button>
            </form>
          </div>

          <div className="recommendations">
            {/* Crisis Hotline Card */}
            <div className="recommendation-card">
              <h4>Crisis Hotline</h4>
              <p>If you need immediate assistance, please call the crisis hotline or visit emergency resources.</p>
              <p>Call: 1-800-273-8255</p>
            </div>

            {/* Activity Suggestion Card */}
            <div className="recommendation-card">
              <h4>Mindfulness Activity</h4>
              <p>{activitySuggestion}</p>
              <button onClick={fetchActivity}>Try a Different Activity</button>
            </div>

            {/* Mood Tracker Card */}
            <div className="recommendation-card" onClick={() => window.location.href = "/mood-tracker"}>
              <h4>Track Your Mood</h4>
              <p>Click here to start tracking your mood daily!</p>
            </div>
          </div>

          <div className="posts">
            {posts.length === 0 ? (
              <p>No Forums Yet</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="post">
                  <div className="post-header">
                    <div className="post-header-2">
                      <img
                        src={
                          post.profilePic ? post.profilePic : defaultProfilePic
                        }
                        alt={post.author}
                        className="profile-pic"
                      />
                      <div className="post-info">
                        <h4>{post.author}</h4>
                        <p>{post.time}</p>
                      </div>
                    </div>
                    <div className="post-header-3">
                      <div className="post-options">
                        <button
                          onClick={() => togglePostOptions(post.id)}
                          className="options-btn"
                        >
                          <FontAwesomeIcon
                            icon={faEllipsis}
                            className="faEllipsis"
                          />
                        </button>
                        {openDropdownId === post.id && (
                          <div className="options-dropdown">
                            {post.userId === auth.currentUser.uid && (
                              <>
                                <button
                                  onClick={() => {
                                    setIsEditing(true);
                                    setEditingContent(post.content);
                                  }}
                                >
                                  Edit
                                </button>
                                <button onClick={() => handleDeletePost(post.id)}>
                                  Delete
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setIsReportModalOpen(true);
                                setReportPostId(post.id);
                              }}
                            >
                              Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isEditing && reportPostId === post.id ? (
                    <div className="edit-section">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                      />
                      <button onClick={() => handleEditPost(post.id)}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="post-content">
                      <p>{post.content}</p>
                    </div>
                  )}
                  <div className="post-actions">
                    <div className="post-stats">
                      <span>{post.loves} 💖</span>
                      <span>{post.comments.length} 💬</span>
                    </div>

                    <div className="post-buttons">
                      <button
                        onClick={() => handleLoveClick(post.id, post.loves)}
                        disabled={lovedPosts.has(post.id)}
                      >
                        {lovedPosts.has(post.id) ? "Loved" : "Love"}
                      </button>

                      <button
                        onClick={() =>
                          setSelectedPost(
                            selectedPost === post.id ? null : post.id
                          )
                        }
                      >
                        {selectedPost === post.id
                          ? "Hide Comments"
                          : "Show Comments"}
                      </button>
                    </div>

                    {selectedPost === post.id && (
                      <div className="comments-section">
                        <div className="comments">
                          {post.comments.length === 0 ? (
                            <p>No Comments Yet</p>
                          ) : (
                            post.comments.map((comment, index) => (
                              <div key={index} className="comment">
                                <strong>{comment.author}</strong>
                                <span>
                                  <small> {comment.time} </small>
                                </span>
                                <p>{comment.text}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="comment-footer">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleCommentSubmit(post.id);
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button type="submit">Comment</button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        postId={reportPostId}
      />
    </div>
  );
};


export default HomePage;
