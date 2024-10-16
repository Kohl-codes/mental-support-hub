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
} from "firebase/firestore";
import { db, auth } from "../configs/firebaseConfig";
import "../styles/home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";

// ReportModal Component
const ReportModal = ({ isOpen, onClose, onSubmit }) => {
  const [reportReason, setReportReason] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reportReason.trim()) {
      onSubmit(reportReason);
      setReportReason("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-dialog">
        <div className="modal-content">
          <header className="modal-header">
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

  const handleReportSubmit = (reason) => {
    console.log(`Reported post ${reportPostId} for reason: ${reason}`);
    // Here you can add logic to save the report to your database or notify an admin.
  };

  const togglePostOptions = (postId) => {
    if (openDropdownId === postId) {
      setOpenDropdownId(null);
    } else {
      setOpenDropdownId(postId);
      setReportPostId(postId);
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
                            <button onClick={() => setIsReportModalOpen(true)}>
                              Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="post-content">
                    <p>{post.content}</p>
                  </div>
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
        onSubmit={handleReportSubmit}
      />
    </div>
  );
};

export default HomePage;
