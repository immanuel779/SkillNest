import { useState } from "react";
import { db, auth } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { FaCheckCircle } from "react-icons/fa";
import AppLayout from "../components/AppLayout"; // ✅ Import AppLayout

const SkillAssessment = () => {
  const [selectedSkill, setSelectedSkill] = useState("Frontend Developer");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [answers, setAnswers] = useState({});

  const skills = ["Frontend Developer", "Backend Developer", "UI/UX Designer", "Data Analyst"];

  const quizzes = {
    "Frontend Developer": [
      { question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style System"], answer: 0 },
      { question: "Which is a JavaScript framework?", options: ["React", "Python", "Django"], answer: 0 },
      { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HighText Machine Language", "Hyperlink Text Marking"], answer: 0 },
    ],
    "Backend Developer": [
      { question: "Which is a backend language?", options: ["Node.js", "React", "HTML"], answer: 0 },
      { question: "What does API stand for?", options: ["Application Programming Interface", "Advanced Programming Input", "Applied Program Index"], answer: 0 },
      { question: "Which is a database?", options: ["MongoDB", "CSS", "JavaScript"], answer: 0 },
    ],
    "UI/UX Designer": [
      { question: "What does UX stand for?", options: ["User Experience", "Universal X-ray", "User Extension"], answer: 0 },
      { question: "What tool is used for design?", options: ["Figma", "VS Code", "Excel"], answer: 0 },
      { question: "What is a wireframe?", options: ["A low-fidelity layout", "A database", "A server"], answer: 0 },
    ],
    "Data Analyst": [
      { question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Logic", "System Quality Level"], answer: 0 },
      { question: "Which tool is for data visualization?", options: ["Tableau", "Photoshop", "Word"], answer: 0 },
      { question: "What is a data frame?", options: ["A table of data", "A type of server", "A coding language"], answer: 0 },
    ],
  };

  const handleStart = () => {
    setCurrentQuestion(0);
    setScore(0);
    setPassed(false);
  };

  const handleAnswer = (optionIndex) => {
    const correct = quizzes[selectedSkill][currentQuestion].answer;
    if (optionIndex === correct) setScore(score + 1);
    setAnswers({ ...answers, [currentQuestion]: optionIndex });

    if (currentQuestion + 1 < quizzes[selectedSkill].length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Check if passed (score > 1)
      if (score + (optionIndex === correct ? 1 : 0) >= 2) {
        setPassed(true);
        saveBadge();
      } else {
        setPassed(true); // Even if failed, show result
      }
    }
  };

  const saveBadge = async () => {
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const existingBadges = userDoc.exists() ? (userDoc.data().verifiedSkills || []) : [];
      if (!existingBadges.includes(selectedSkill)) {
        await setDoc(userRef, {
          verifiedSkills: [...existingBadges, selectedSkill],
          updatedAt: new Date()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error saving badge:", error);
    }
  };

  if (passed) {
    return (
      <div className="auth-container">
        <div className="glass-card">
          <div className="auth-avatar">🏅</div>
          <h1 className="logo-text">Assessment Done!</h1>
          <p style={{ textAlign: "center", marginBottom: "20px" }}>
            {score >= 2 ? "Congratulations! You earned the badge!" : "You didn't pass this time. Try again!"}
          </p>
          <button className="btn btn-primary" onClick={handleStart}>Retake Test</button>
        </div>
      </div>
    );
  }

  const quiz = quizzes[selectedSkill];

  return (
    <AppLayout> {/* ✅ Wrapped with AppLayout for Hamburger + Bell! */}
      <div className="glass-card form-card">
        <h1 className="logo-text">Skill Assessment</h1>
        <p style={{ textAlign: "center", opacity: 0.7, marginBottom: "20px" }}>Earn verified badges!</p>
        
        <div className="form-group">
          <label className="form-label">Select Skill</label>
          <select className="input-field" value={selectedSkill} onChange={(e) => { setSelectedSkill(e.target.value); handleStart(); }}>
            {skills.map(skill => <option key={skill} value={skill}>{skill}</option>)}
          </select>
        </div>

        <div className="quiz-container">
          <h3>Question {currentQuestion + 1} of {quiz.length}</h3>
          <p className="quiz-question">{quiz[currentQuestion].question}</p>
          <div className="quiz-options">
            {quiz[currentQuestion].options.map((option, idx) => (
              <button key={idx} className="btn btn-google" style={{ marginBottom: '10px' }} onClick={() => handleAnswer(idx)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SkillAssessment;