import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import NotesManager from './components/NotesManager';
import SyllabusTracker from './components/SyllabusTracker';
import ExamPlanner from './components/ExamPlanner';
import AICoach from './components/AICoach';
import FocusMode from './components/FocusMode';
import AuthModal from './components/AuthModal';
import { ViewState, Subject, Note, SyllabusItem, Exam, FocusSession } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('roncate_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Auth State
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Apply Dark Mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('roncate_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('roncate_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch extended profile (Student details)
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
        setView('dashboard');
      } else {
        setUserProfile(null);
        setView('landing');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setView('landing');
  };

  // Load state from local storage or defaults
  // Note: In a full migration, these would also come from Firestore based on user.uid
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('roncate_subjects');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Mathematics', color: '#4f46e5' },
      { id: '2', name: 'History', color: '#ea580c' }
    ];
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('roncate_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [syllabus, setSyllabus] = useState<SyllabusItem[]>(() => {
    const saved = localStorage.getItem('roncate_syllabus');
    return saved ? JSON.parse(saved) : [];
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('roncate_exams');
    return saved ? JSON.parse(saved) : [];
  });

  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
    const saved = localStorage.getItem('roncate_focus_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => localStorage.setItem('roncate_subjects', JSON.stringify(subjects)), [subjects]);
  useEffect(() => localStorage.setItem('roncate_notes', JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem('roncate_syllabus', JSON.stringify(syllabus)), [syllabus]);
  useEffect(() => localStorage.setItem('roncate_exams', JSON.stringify(exams)), [exams]);
  useEffect(() => localStorage.setItem('roncate_focus_sessions', JSON.stringify(focusSessions)), [focusSessions]);

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  if (!user || view === 'landing') {
    return (
      <>
        <LandingPage 
          onOpenAuth={() => setShowAuthModal(true)} 
          isDarkMode={isDarkMode} 
          toggleDarkMode={toggleDarkMode} 
        />
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={(profile) => {
            setUserProfile(profile);
            // View transition handled by auth listener
          }}
        />
      </>
    );
  }

  return (
    <Layout currentView={view} setView={setView} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode}>
      {/* Optional: Add a profile header in the layout showing user details */}
      {view === 'dashboard' && (
        <div className="mb-6">
          {userProfile && (
             <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-lg mb-6 flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-indigo-900 dark:text-indigo-200">
                    Welcome, {userProfile.name}
                  </h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    {userProfile.userType === 'school' 
                      ? `Student • Class ${userProfile.standard}`
                      : `${userProfile.collegeName} • ${userProfile.branch} • Year ${userProfile.year}`
                    }
                  </p>
               </div>
               <button onClick={handleLogout} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                 Log Out
               </button>
             </div>
          )}
          <Dashboard 
            subjects={subjects} 
            syllabus={syllabus} 
            exams={exams}
            notes={notes}
          />
        </div>
      )}
      {view === 'focus' && (
        <FocusMode 
          sessions={focusSessions}
          setSessions={setFocusSessions}
        />
      )}
      {view === 'syllabus' && (
        <SyllabusTracker 
          subjects={subjects} 
          syllabus={syllabus} 
          setSubjects={setSubjects} 
          setSyllabus={setSyllabus} 
        />
      )}
      {view === 'notes' && (
        <NotesManager 
          subjects={subjects} 
          notes={notes} 
          setNotes={setNotes} 
        />
      )}
      {view === 'exams' && (
        <ExamPlanner 
          exams={exams} 
          subjects={subjects} 
          setExams={setExams} 
        />
      )}
      {view === 'ai-coach' && (
        <AICoach 
          syllabus={syllabus} 
          exams={exams} 
        />
      )}
    </Layout>
  );
};

export default App;