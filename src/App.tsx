import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Budgets from "./pages/Budgets";
import Users from "./pages/Users";
import Layout from "./components/Layout";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Bootstrap admin check
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Create user record
          const isFirstAdmin = currentUser.email === "thalyreis64@gmail.com" || currentUser.email === "admin@contabilpro.com";
          await setDoc(userRef, {
            email: currentUser.email,
            uid: currentUser.uid,
            role: isFirstAdmin ? "admin" : "user",
            createdAt: serverTimestamp(),
          });
          setIsAdmin(isFirstAdmin);
        } else {
          setIsAdmin(userSnap.data().role === "admin");
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={user ? <Layout isAdmin={isAdmin}><Home /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/budgets"
          element={user ? <Layout isAdmin={isAdmin}><Budgets /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/users"
          element={user && isAdmin ? <Layout isAdmin={isAdmin}><Users /></Layout> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}
