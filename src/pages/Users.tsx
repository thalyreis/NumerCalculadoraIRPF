import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { UserPlus, Trash2, Shield, User as UserIcon, Mail, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "user";
  createdAt: any;
}

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Check if current user is admin
    const checkAdmin = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists() && doc.data().role === "admin") {
        setIsAdmin(true);
      } else if (auth.currentUser?.email === "thalyreis64@gmail.com") {
        setIsAdmin(true); // Bootstrap admin
      }
    });

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserProfile[];
      setUsers(docs);
      setLoading(false);
    });

    return () => {
      checkAdmin();
      unsubscribe();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!newEmail) return;

    try {
      // Note: This only adds to Firestore. The user still needs to sign up 
      // or the admin needs to use a Cloud Function to create the Auth user.
      // For this demo, we'll assume the user will sign up with this email.
      const userRef = doc(collection(db, "users")); 
      // In a real app, we'd use the UID from Auth. 
      // Here we'll use a placeholder or just wait for them to log in.
      // Better: Let's just list them.
      alert("Para adicionar um usuário real, ele deve se cadastrar no sistema. Esta lista apenas gerencia permissões.");
    } catch (err) {
      console.error(err);
      setError("Erro ao adicionar usuário.");
    }
  };

  const toggleRole = async (user: UserProfile) => {
    try {
      const nextRole = user.role === "admin" ? "user" : "admin";
      await setDoc(doc(db, "users", user.id), { role: nextRole }, { merge: true });
    } catch (err) {
      console.error(err);
      alert("Erro ao alterar permissão.");
    }
  };

  const handleDelete = async (id: string) => {
    if (id === auth.currentUser?.uid) {
      alert("Você não pode excluir seu próprio usuário.");
      return;
    }
    if (window.confirm("Remover este usuário do sistema?")) {
      try {
        await deleteDoc(doc(db, "users", id));
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir usuário.");
      }
    }
  };

  if (!isAdmin && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-16 h-16 text-red-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
        <p className="text-gray-500">Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h2>
        <p className="text-gray-500 text-sm">Controle quem tem acesso ao sistema e suas permissões</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-2 rounded-full",
                user.role === "admin" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
              )}>
                {user.role === "admin" ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{user.role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleRole(user)}
                className="px-3 py-1 text-xs font-bold border border-gray-200 rounded-md hover:bg-gray-50 transition-all"
              >
                Mudar para {user.role === "admin" ? "Usuário" : "Admin"}
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
        <h3 className="text-orange-800 font-bold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Nota Importante
        </h3>
        <p className="text-orange-700 text-sm">
          Novos usuários devem se cadastrar no sistema. Após o primeiro login, eles aparecerão nesta lista e você poderá promover um usuário a Administrador.
        </p>
      </div>
    </div>
  );
}
