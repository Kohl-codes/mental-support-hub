import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { collection, addDoc, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from "../configs/firebaseConfig";

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedPost, setSelectedPost] = useState(null); // Track selected post for comments
  const [newComment, setNewComment] = useState(''); // Track the new comment input

  // Default profile pic URL
  const defaultProfilePic = '/path/to/default-profile-pic.png'; 

  // Fetch posts from Firebase on component mount
  useEffect(() => {
    const fetchPosts = async () => {
      const querySnapshot = await getDocs(collection(db, "forums"));
      const forums = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(forums);
    };
    
    fetchPosts();
  }, []);

  // Handle post creation
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (newPostContent.trim() === '') return;

    // Add new post to Firebase
    try {
      const newPost = {
        author: 'Current User',  // Replace with dynamic user data
        profilePic: 'path-to-profile-pic',  // Fetch from user profile
        time: new Date().toLocaleTimeString(),
        content: newPostContent,
        comments: [],
        loves: 0,
      };
      const docRef = await addDoc(collection(db, "forums"), newPost);
      setPosts([...posts, { id: docRef.id, ...newPost }]);
      setNewPostContent(''); // Clear the input field
    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  // Handle love button click
  const handleLoveClick = async (postId, currentLoves) => {
    const postRef = doc(db, "forums", postId);
    try {
      await updateDoc(postRef, { loves: currentLoves + 1 });
      setPosts(posts.map(post => post.id === postId ? { ...post, loves: currentLoves + 1 } : post));
    } catch (error) {
      console.error("Error updating loves: ", error);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (postId) => {
    if (newComment.trim() === '') return;

    const postRef = doc(db, "forums", postId);
    try {
      // Add new comment to the comments array in the post
      await updateDoc(postRef, {
        comments: arrayUnion({
          author: 'Current User', // Replace with dynamic user data
          time: new Date().toLocaleTimeString(),
          text: newComment
        })
      });

      // Update local state to reflect the new comment
      setPosts(posts.map(post => post.id === postId
        ? { ...post, comments: [...post.comments, { author: 'Current User', time: new Date().toLocaleTimeString(), text: newComment }] }
        : post
      ));
      setNewComment(''); // Clear the comment input
      setSelectedPost(null); // Close comment input for the post
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  return (
    <div className="home-page">
      <Navbar />
      <div className="main-content">
        <Sidebar />
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

          {/* Display posts */}
          <div className="posts">
            {posts.length === 0 ? (
              <p>No Forums Yet</p>
            ) : (
              posts.map(post => (
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
                  </div>
                  <div className="post-content">
                    <p>{post.content}</p>
                  </div>
                  <div className="post-actions">
                    <span>{post.loves} 💖</span>
                    <button onClick={() => handleLoveClick(post.id, post.loves)}>Love</button>

                    <span>{post.comments.length} 💬</span>
                    <button onClick={() => setSelectedPost(post.id)}>Comment</button>

                    {/* Show comment form if this post is selected */}
                    {selectedPost === post.id && (
                      <div className="comment-section">
                        <textarea
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        ></textarea>
                        <button onClick={() => handleCommentSubmit(post.id)}>Submit</button>
                      </div>
                    )}

                    {/* Display comments */}
                    <div className="comments">
                      {post.comments.map((comment, index) => (
                        <div key={index} className="comment">
                          <p><strong>{comment.author}</strong> at {comment.time}</p>
                          <p>{comment.text}</p>
                        </div>
                      ))}
                    </div>
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
