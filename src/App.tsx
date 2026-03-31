import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Budgets from "./pages/Budgets";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
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
          // Check if there's a pre-authorized role for this email
          const usersQuery = query(collection(db, "users"), where("email", "==", currentUser.email));
          const querySnap = await getDocs(usersQuery);
          
          let preAssignedRole: "admin" | "user" = "user";
          let preAssignedDocId: string | null = null;

          if (!querySnap.empty) {
            const preDoc = querySnap.docs[0];
            preAssignedRole = preDoc.data().role || "user";
            preAssignedDocId = preDoc.id;
          }

          // Create user record with the actual UID
          const isFirstAdmin = currentUser.email === "thalyreis64@gmail.com" || currentUser.email === "admin@contabilpro.com";
          const finalRole = isFirstAdmin ? "admin" : preAssignedRole;

          await setDoc(userRef, {
            email: currentUser.email,
            uid: currentUser.uid,
            role: finalRole,
            createdAt: serverTimestamp(),
          });

          // If there was a pre-assigned doc with a different ID (like a placeholder), delete it
          if (preAssignedDocId && preAssignedDocId !== currentUser.uid) {
            await deleteDoc(doc(db, "users", preAssignedDocId));
          }

          setIsAdmin(finalRole === "admin");
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
          element={user ? <Layout isAdmin={isAdmin}><Home isAdmin={isAdmin} /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/budgets"
          element={user ? <Layout isAdmin={isAdmin}><Budgets isAdmin={isAdmin} /></Layout> : <Navigate to="/login" />}
        />
        <Route
          path="/users"
          element={user && isAdmin ? <Layout isAdmin={isAdmin}><Users /></Layout> : <Navigate to="/" />}
        />
        <Route
          path="/settings"
          element={user && isAdmin ? <Layout isAdmin={isAdmin}><Settings /></Layout> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}
