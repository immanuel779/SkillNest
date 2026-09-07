import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { FaLinkedinIn, FaTwitter, FaFacebookF, FaCheckCircle } from "react-icons/fa";
import AppLayout from "../components/AppLayout";

const BrowseNeeds = () => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [skill, setSkill] = useState("all");
  const [saved, setSaved] = useState([]);

  const locations = ["all", "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Kaduna", "Ogun", "Remote", "Other"];
  
  // ✅ EXPANDED SKILLS LIST (100+ Tech, Vocational, Career, Healthcare, etc.)
  const skills = [
    "all", // Keep at top for filter
    // Tech & Digital
    "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer",
    "UI/UX Designer", "Graphic Designer", "Product Designer", "Data Analyst", "Data Scientist",
    "Machine Learning Engineer", "DevOps Engineer", "Cloud Engineer", "Cybersecurity Specialist",
    "IT Support Specialist", "Software Tester",
    // Vocational & Trades
    "Electrician", "Plumber", "Welder", "Carpenter", "Mason", "Painter", "Auto Mechanic",
    "HVAC Technician", "Solar Panel Installer", "Generator Repairer", "Tailor", "Fashion Designer",
    "Hair Stylist", "Barber", "Makeup Artist", "Shoemaker", "Upholsterer", "Glass Fitter", "Tiler",
    // Creative & Media
    "Content Writer", "Copywriter", "Technical Writer", "Blogger", "Editor", "Proofreader",
    "Video Editor", "Photographer", "Animator", "3D Designer", "Illustrator", "Voice Over Artist",
    "Music Producer", "DJ", "Actor", "Model", "Social Media Manager", "SEO Specialist",
    "Email Marketer", "Brand Strategist",
    // Business & Management
    "Project Manager", "Product Manager", "Business Analyst", "Accountant", "Financial Analyst",
    "Auditor", "Lawyer", "HR Specialist", "Recruiter", "Sales Representative", "Customer Support",
    "Community Manager", "Event Planner", "Virtual Assistant", "Admin Assistant", "Data Entry Clerk",
    "Logistic Coordinator", "Supply Chain Manager",
    // Education & Training
    "Tutor", "Teacher", "Curriculum Developer", "Translator", "Language Instructor",
    "Academic Coach", "Exam Preparer", "Online Course Creator", "Podcast Host",
    // Healthcare & Wellness
    "Nurse", "Caregiver", "Pharmacist", "Doctor", "Dentist", "Physiotherapist", "Psychologist",
    "Nutritionist", "Fitness Trainer", "Yoga Instructor", "Massage Therapist", "Counselor",
    // Hospitality & Service
    "Chef", "Cook", "Waiter", "Bartender", "Hotel Manager", "Housekeeper", "Tour Guide",
    "Flight Attendant", "Barista", "Caterer",
    // Construction & Engineering
    "Civil Engineer", "Structural Engineer", "Architect", "Surveyor", "Site Supervisor",
    "Heavy Equipment Operator", "Crane Operator", "Scaffolder",
    // Transportation & Logistics
    "Driver", "Delivery Rider", "Truck Driver", "Pilot", "Ship Captain", "Warehouse Manager",
    "Customs Officer",
    // Agriculture & Environment
    "Farmer", "Agronomist", "Fisherman", "Gardener", "Landscaper", "Animal Caretaker",
    "Environmental Scientist",
    // Other Career Skills
    "Security Guard", "Cleaner", "Laundry Attendant", "Janitor", "Decorator",
    "Call Center Agent", "Telemarketer"
  ];

  useEffect(() => {
    // ✅ Fixed Render URL
    fetch("https://skillnest-88fd.onrender.com/api/needs")
      .then(res => res.json())
      .then(data => { setNeeds(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });

    const loadSaved = async () => {
      const ref = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setSaved(snap.data().savedJobs || []);
    };
    loadSaved();
  }, []);

  const filtered = needs.filter(n =>
    (n.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.skillRequired || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.location || '').toLowerCase().includes(search.toLowerCase())
  ).filter(n => location === "all" || n.location === location)
   .filter(n => skill === "all" || n.skillRequired === skill);

  const toggleSave = async (id) => {
    const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
    setSaved(next);
    await setDoc(doc(db, "users", auth.currentUser.uid), { savedJobs: next }, { merge: true });
  };

  const shareJob = (platform, job) => {
    const url = window.location.origin + `/apply/${job.id}`;
    const text = `Check out this job: ${job.title} at ${job.organizationName}!`;
    
    if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  if (loading) return <div className="dashboard-loader"><div className="loader-spinner"></div><p>Loading jobs...</p></div>;

  return (
    <AppLayout>
      <div className="browse-container">
        <div className="browse-header">
          <h1>Browse Opportunities</h1>
          <Link to="/post-need" className="btn btn-primary">➕ Post a Need</Link>
        </div>

        <div className="search-wrapper">
          <input className="input-field" placeholder="Search by title, skill, or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="filter-row">
            <select className="input-field" value={location} onChange={(e) => setLocation(e.target.value)}>
              {locations.map(l => <option key={l} value={l}>{l === "all" ? "All Locations" : l}</option>)}
            </select>
            <select className="input-field" value={skill} onChange={(e) => setSkill(e.target.value)}>
              {skills.map(s => <option key={s} value={s}>{s === "all" ? "All Skills" : s}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="error-alert">❌ {error}</div>}
        {!error && filtered.length === 0 && <div className="empty-state"><div className="empty-icon">🔍</div><h3>No jobs found</h3></div>}

        <div className="needs-grid">
          {filtered.map(n => (
            <div key={n.id} className="need-card">
              <div className="need-card-top">
                <h3>{n.title}</h3>
                <button onClick={() => toggleSave(n.id)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>🔖</button>
              </div>
              <p className="need-org">
                🏢 {n.organizationName}
                {n.verifiedOrg && (
                  <span style={{ color: '#00bfff', marginLeft: '5px' }} title="Verified Organization">
                    <FaCheckCircle />
                  </span>
                )}
              </p>
              <p className="need-location">📍 {n.location}</p>
              <div className="need-tags"><span className="skill-badge">⚡ {n.skillRequired}</span></div>

              <div className="share-buttons">
                <button className="share-btn linkedin" onClick={() => shareJob('linkedin', n)}><FaLinkedinIn /></button>
                <button className="share-btn twitter" onClick={() => shareJob('twitter', n)}><FaTwitter /></button>
                <button className="share-btn facebook" onClick={() => shareJob('facebook', n)}><FaFacebookF /></button>
              </div>

              <Link to={`/apply/${n.id}`} className="btn btn-primary" style={{ marginTop: '10px', textAlign: 'center' }}>📝 Apply Now</Link>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default BrowseNeeds;