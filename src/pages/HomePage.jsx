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
} from "firebase/firestore";
import { db, auth } from "../configs/firebaseConfig";
import "../styles/home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { getDoc } from "firebase/firestore";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [lovedPosts, setLovedPosts] = useState(new Set());
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

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
        author: userProfile.name || "Anonymous User", // Use the logged-in user's name
        profilePic: userProfile.profilePic || defaultProfilePic, // Use the user's profile picture
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
          author: userProfile.name || "Anonymous User", // Use the logged-in user's name
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

  const togglePostOptions = (postId) => {
    setOpenDropdownId(openDropdownId === postId ? null : postId);
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
                    <img
                      src={post.profilePic ? post.profilePic : defaultProfilePic}
                      alt={post.author}
                      className="profile-pic"
                    />
                    <div className="post-info">
                      <h4>{post.author}</h4>
                      <p>{post.time}</p>
                    </div>
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
                          <button>Report</button>
                        </div>
                      )}
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
                          {post.comments.map((comment, index) => (
                            <div key={index} className="comment">
                              <p>
                                <strong>{comment.author}</strong> at{" "}
                                {comment.time}
                              </p>
                              <p>{comment.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="comment-footer">
                          <textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          ></textarea>
                          <button onClick={() => handleCommentSubmit(post.id)}>
                            Submit
                          </button>
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
    </div>
  );
};

export default HomePage;
