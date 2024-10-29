import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../configs/firebaseConfig";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/chatmenu.css";
import "../styles/modal.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faComment,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

const ChatMenuPage = ({ setRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const chatroomsRef = collection(db, "chatrooms");
  const postsRef = collection(db, "posts");
  const currentUser = auth.currentUser;

  // Fetch existing chatrooms
  useEffect(() => {
    const unsubscribe = onSnapshot(query(chatroomsRef), (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  // Fetch posts in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(query(postsRef), (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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

  // Join a chatroom
  const handleJoinRoom = (roomName) => {
    setRoom(roomName);
    navigate(`/chat`);
  };

  // Create a new post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    try {
      await addDoc(postsRef, {
        content: newPost,
        createdBy: currentUser.displayName,
        createdById: currentUser.uid,
        createdAt: new Date(),
      });
      setNewPost("");
    } catch (error) {
      console.error("Error creating post: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Edit an existing post
  const handleEditPost = async (postId) => {
    if (!editedContent.trim()) return;

    setLoading(true);
    try {
      await updateDoc(doc(postsRef, postId), { content: editedContent });
      setEditingPostId(null);
      setEditedContent("");
    } catch (error) {
      console.error("Error editing post: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete a post
  const handleDeletePost = async (postId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(postsRef, postId));
    } catch (error) {
      console.error("Error deleting post: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="bg-chat">
        <a href="#id01" className="profile-btn">Profile</a>

        {/* Modal for Profile */}
        <div id="id01" className="modal">
          <div className="modal-dialog">
            <div className="modal-content">
              <header className="container">
                <a href="#" className="closebtn">×</a>
                <h2>Profile</h2>
              </header>
              <div className="container">
                <Sidebar />
              </div>
            </div>
          </div>
        </div>

        <div className="chat-menu-container">
          {/* Chatrooms Section */}
          <div className="chat-container">
            <h1>Chatrooms</h1>
            <div className="room-list">
              {rooms.map((room) => (
                <div key={room.id} className="room-item">
                  <h3>{room.name}</h3>
                  {room.password && <FontAwesomeIcon icon={faLock} />}
                  <button onClick={() => handleJoinRoom(room.name)}>Join</button>
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateRoom} className="new-room-form">
              <h3>Create a new Room</h3>
              <input
                type="text"
                placeholder="Room Name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
              />
              <div className="protect-checkbox">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMenuPage;
