import { useEffect, useState, useRef } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../configs/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import "react-toastify/dist/ReactToastify.css";
import "../styles/chat.css";
import Modal from "react-modal";

// Sound alert for new messages
const notificationSound = new Audio("../assets/notif.mp3");

const Chat = (props) => {
  const { room } = props;
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesRef = collection(db, "messages");
  const chatroomsRef = collection(db, "chatrooms");
  const navigate = useNavigate();

  useEffect(() => {
    const queryMessages = query(
      messagesRef,
      where("room", "==", room),
      orderBy("createdAt")
    );
    const unsubscribe = onSnapshot(queryMessages, (snapshot) => {
      let newMessages = [];
      snapshot.forEach((doc) => {
        newMessages.push({ ...doc.data(), id: doc.id });
      });

      // Trigger toast notification for new messages from others
      if (newMessages.length > messages.length) {
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.user !== auth.currentUser.displayName) {
          showToast(lastMessage);
          playNotificationSound();
        }
      }

      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [room]); // Remove messages from dependency array

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track typing status
  useEffect(() => {
    const typingStatusRef = collection(db, "typingStatuses");
    const q = query(typingStatusRef, where("room", "==", room));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typing = snapshot.docs.map((doc) => doc.data().user);
      setTypingUsers(
        typing.filter((user) => user !== auth.currentUser.displayName)
      );
    });

    return () => unsubscribe();
  }, [room]);

  // Handling chatroom creation and password protection
  const handleCreateRoom = async (roomName, roomPassword = "") => {
    if (!roomName) return;

    const roomDocRef = doc(chatroomsRef, roomName);
    const roomSnapshot = await getDoc(roomDocRef);

    if (!roomSnapshot.exists()) {
      // Create the room with optional password
      await setDoc(roomDocRef, {
        name: roomName,
        password: roomPassword ? roomPassword : null,
        createdBy: auth.currentUser.displayName,
      });
      navigate(`/chat/${roomName}`);
    } else {
      toast.error("Room already exists!");
    }
  };

  const handleJoinRoom = async (roomName, roomPassword = "") => {
    const roomDocRef = doc(chatroomsRef, roomName);
    const roomSnapshot = await getDoc(roomDocRef);

    if (roomSnapshot.exists()) {
      const roomData = roomSnapshot.data();
      if (roomData.password && roomData.password !== roomPassword) {
        toast.error("Incorrect password!");
        return;
      }
      navigate(`/chat/${roomName}`);
    } else {
      toast.error("Room does not exist!");
    }
  };

  // Sending messages to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage === "") return;

    await addDoc(messagesRef, {
      text: newMessage,
      createdAt: serverTimestamp(),
      user: auth.currentUser.displayName,
      room,
    });

    setNewMessage("");
    handleTyping(false);
  };

  const handleTyping = async (isTyping) => {
    const typingStatusRef = collection(db, "typingStatuses");
    const typingDocRef = doc(
      typingStatusRef,
      `${room}_${auth.currentUser.uid}`
    );

    if (isTyping) {
      await setDoc(typingDocRef, {
        user: auth.currentUser.displayName,
        room,
        typing: true,
      });
    } else {
      await deleteDoc(typingDocRef);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping(e.target.value !== "");
  };

  const handleBlur = () => {
    handleTyping(false);
  };

  const goBack = () => {
    navigate("/chatmenu");
  };

  const handleUserClick = (name) => {
    navigate(`/profile/${name}`);
  };

  const showToast = (message) => {
    toast.info(`${message.user}: ${message.text}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const playNotificationSound = () => {
    notificationSound
      .play()
      .catch((error) =>
        console.error("Error playing notification sound:", error)
      );
  };

  // Modal management for inviting users
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleInviteUser = (e) => {
    e.preventDefault();
    // Invitation logic (e.g., send email or notification to invite the user)
    toast.success(`User invited: ${inviteEmail}`);
    setInviteEmail("");
    closeModal();
  };

  return (
    <div className="chat-bg">
      {/* removed navbar to get a better look of the chat for the users */}
      <div className="chat-container-1">
        <div className="header">
          <button className="go-back-button" onClick={goBack}>
            <FaArrowLeft />
          </button>
          <h1>{room}</h1>
          <button className="invite-button" onClick={openModal}>
            Invite
          </button>
        </div>
        <div className="messages">
          {messages.map((message) => (
            <div
              className={`message ${
                message.user === auth.currentUser.displayName
                  ? "own-message"
                  : "other-message"
              }`}
              key={message.id}
            >
              {message.user !== auth.currentUser.displayName && (
                <span
                  className="user"
                  onClick={() => handleUserClick(message.user)}
                >
                  {message.user}{" "}
                  <span className="hover-text">
                    <FontAwesomeIcon icon={faEye} />
                  </span>
                  :{" "}
                </span>
              )}
              {message.text}
            </div>
          ))}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
              typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="new-message-form">
          <input
            placeholder="Type your message here..."
            className="new-message-input"
            onChange={handleInputChange}
            value={newMessage}
            onBlur={handleBlur}
          />
          <button type="submit" className="send-button">
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
        <ToastContainer />

        {/* Invite users modal */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          contentLabel="Invite Users Modal"
          className="invite-modal"
        >
          <div className="modal-header">
            <h2>Invite a User</h2>
            <button onClick={closeModal} className="modal-close">
              <FontAwesomeIcon icon={faClose} />
            </button>
          </div>
          <form onSubmit={handleInviteUser}>
            <input
              type="email"
              placeholder="Enter user email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
            <button type="submit" className="modal-send">
              Send Invite
            </button>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default Chat;
