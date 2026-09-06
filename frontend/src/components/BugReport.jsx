import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext"; // Use our upgraded context!
import { FaBug, FaPaperclip, FaTimes, FaCheckCircle, FaSpinner } from "react-icons/fa";

const BugReport = () => {
  const { user, userProfile } = useAuth(); // Load from context
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal closes
  const resetForm = () => {
    setDescription("");
    setPageUrl("");
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return "";
    try {
      const token = await user.getIdToken(true); // Force fresh token
      const formData = new FormData();
      formData.append("file", imageFile);
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error("Image upload failed");
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUploading(true);

    try {
      const imageUrl = await uploadImage();
      if (imageFile && imageUrl === null) {
        setError("Image upload failed. Please try again.");
        setUploading(false);
        return;
      }

      await addDoc(collection(db, "bug_reports"), {
        description,
        pageUrl: window.location.href,
        userId: user?.uid || null,
        userName: userProfile?.name || "Not logged in",
        userEmail: userProfile?.email || user?.email || "Not logged in",
        imageUrl: imageUrl || "",
        createdAt: serverTimestamp(),
        status: "open"
      });

      setSent(true);
      setTimeout(() => {
        setIsOpen(false);
        setSent(false);
        resetForm();
      }, 2000);
    } catch (err) {
      console.error("Bug report error:", err);
      setError("Error saving bug report. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <button className="bug-float-btn" onClick={() => setIsOpen(!isOpen)} title="Report a Bug">
        <FaBug />
      </button>

      {isOpen && (
        <div className="bug-modal-overlay" onClick={() => { setIsOpen(false); resetForm(); }}>
          <div className="bug-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FaBug style={{ marginRight: '10px', color: '#ff8c00' }} /> Report a Bug</h3>
              <button className="btn-sm" onClick={() => { setIsOpen(false); resetForm(); }}>
                <FaTimes />
              </button>
            </div>
            
            <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '15px' }}>
              Tell us what went wrong and we'll fix it!
            </p>

            {sent && (
              <div className="success-alert" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaCheckCircle /> Bug reported! Thanks for helping us improve.
              </div>
            )}
            
            {error && <div className="error-alert">❌ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Page URL</label>
                <input 
                  className="input-field" 
                  type="text" 
                  value={pageUrl} 
                  onChange={(e) => setPageUrl(e.target.value)} 
                  placeholder="e.g. /dashboard" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label"><FaPaperclip style={{ marginRight: '5px' }} /> Upload Screenshot (Optional)</label>
                <div className="bug-image-upload">
                  <label className="upload-bug-image-btn">
                    <FaPaperclip /> {imageFile ? "Change Image" : "Attach Image"}
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                  </label>
                  {imagePreview && (
                    <img src={imagePreview} alt="Bug Screenshot Preview" className="bug-image-preview" />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Describe the Bug</label>
                <textarea 
                  className="input-field textarea-field" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="What happened? What did you expect to happen?" 
                  rows="4" 
                  required
                ></textarea>
              </div>

              <button className="btn btn-primary" type="submit" disabled={uploading}>
                {uploading ? <><FaSpinner className="spin" /> Submitting...</> : "Submit Bug Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BugReport;