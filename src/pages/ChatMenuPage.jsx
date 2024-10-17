import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../configs/firebaseConfig";
import Navbar from "../components/Navbar";  
import Sidebar from "../components/Sidebar"; 
import "../styles/chatmenu.css";

const ChatMenuPage = ({ setRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [posts, setPosts] = useState([]); 
  const [newPost, setNewPost] = useState(""); 
  const navigate = useNavigate();
  const chatroomsRef = collection(db, "chatrooms");
  const postsRef = collection(db, "posts"); 
  const currentUser = auth.currentUser; 

  // Fetch existing chatrooms
  useEffect(() => {
    const q = query(chatroomsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let chatrooms = [];
      snapshot.forEach((doc) => {
        chatrooms.push({ ...doc.data(), id: doc.id });
      });
      setRooms(chatrooms);
    });

    return () => unsubscribe();
  }, []);

  // Fetch forum posts
  useEffect(() => {
    const q = query(postsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let forumPosts = [];
      snapshot.forEach((doc) => {
        forumPosts.push({ ...doc.data(), id: doc.id });
      });
      setPosts(forumPosts);
    });

    return () => unsubscribe();
  }, []);

  // Create a new chatroom
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName) return;

    const roomDocRef = doc(chatroomsRef, newRoomName);
    const roomSnapshot = await getDoc(roomDocRef);

    if (!roomSnapshot.exists()) {
      await addDoc(chatroomsRef, {
        name: newRoomName,
        password: isPasswordProtected ? password : null,
        createdBy: currentUser.displayName,
      });
      setRoom(newRoomName);
      navigate(`/chat`);
    } else {
      alert("Room already exists!");
    }
  };

  // Handle joining a chatroom
  const handleJoinRoom = (roomName) => {
    setRoom(roomName);
    navigate(`/chat`);
  };

  // Handle creating a new forum post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost) return;

    await addDoc(postsRef, {
      content: newPost,
      createdBy: currentUser.displayName,
      createdById: currentUser.uid,
      createdAt: new Date(),
    });

    setNewPost(""); 
  };

  return (
    <div className="chat-menu-page">
      <Navbar />  {/* Add Navbar at the top */}
      <div className="content-wrapper">
        <Sidebar /> {/* Add Sidebar on the side */}
        <div className="chat-menu-content">
          <h1>Choose a Chatroom</h1>
          <div className="room-list">
            {rooms.map((room) => (
              <div key={room.id} className="room-item">
                <h3>{room.name}</h3>
                {room.password && <span>Password Protected</span>}
                <button onClick={() => handleJoinRoom(room.name)}>Join</button>
              </div>
            ))}
          </div>

          <form onSubmit={handleCreateRoom} className="new-room-form">
            <h2>Create a new Room</h2>
            <input
              type="text"
              placeholder="Room Name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              required
            />
            <div>
              <input
                type="checkbox"
                checked={isPasswordProtected}
                onChange={(e) => setIsPasswordProtected(e.target.checked)}
              />
              <label>Password Protected</label>
            </div>
            {isPasswordProtected && (
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
            <button type="submit">Create Room</button>
          </form>

          <h2>Forum</h2>
          <form onSubmit={handleCreatePost} className="post-form">
            <input
              type="text"
              placeholder="Write a post..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              required
            />
            <button type="submit">Post</button>
          </form>

          <div className="post-list">
            {posts.map((post) => (
              <div key={post.id} className="post-item">
                <p>{post.content}</p>
                <small>Posted by {post.createdBy} on {new Date(post.createdAt).toLocaleString()}</small>
                {post.createdById === currentUser.uid && (
                  <span className="your-post"> (Your Post)</span>
                )}   
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMenuPage;
