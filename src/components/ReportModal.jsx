import { useState } from "react";
import { db } from "../configs/firebaseConfig"; // Import Firebase config
import { collection, addDoc } from "firebase/firestore"; // Import Firestore methods
import "../styles/report.css";

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

export default ReportModal;
