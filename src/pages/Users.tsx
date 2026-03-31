import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, where, getDocs } from "firebase/firestore";
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
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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
      // Check if user already exists
      const q = query(collection(db, "users"), where("email", "==", newEmail));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        setError("Este e-mail já está cadastrado ou pré-autorizado.");
        return;
      }

      // Create a placeholder document with a random ID
      const newDocRef = doc(collection(db, "users"));
      await setDoc(newDocRef, {
        email: newEmail,
        role: newRole,
        tempPassword: newPassword,
        createdAt: serverTimestamp(),
        preAuthorized: true
      });

      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      setFeedback({ 
        message: "Usuário pré-autorizado com sucesso! Informe ao usuário o e-mail e a senha temporária definida.", 
        type: "success" 
      });
    } catch (err) {
      console.error(err);
      setError("Erro ao adicionar usuário.");
    }
  };

  const toggleRole = async (user: UserProfile) => {
    console.log("Toggling role for user:", user.email);
    try {
      const nextRole = user.role === "admin" ? "user" : "admin";
      await setDoc(doc(db, "users", user.id), { role: nextRole }, { merge: true });
      console.log("Role updated successfully to:", nextRole);
    } catch (err: any) {
      console.error("Error toggling role:", err);
      setFeedback({ 
        message: `Erro ao alterar permissão: ${err.message || "Erro desconhecido"}`, 
        type: "error" 
      });
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      console.log("Deleting document from Firestore path: users/" + userToDelete.id);
      await deleteDoc(doc(db, "users", userToDelete.id));
      console.log("Document deleted successfully from Firestore");
      setFeedback({ message: "Usuário removido com sucesso do banco de dados.", type: "success" });
    } catch (err: any) {
      console.error("Error deleting user from Firestore:", err);
      setFeedback({ message: `Erro ao excluir usuário: ${err.message || "Erro desconhecido"}`, type: "error" });
    } finally {
      setUserToDelete(null);
    }
  };

  const handleDelete = (user: UserProfile) => {
    console.log("handleDelete requested for user:", user.email);
    if (!auth.currentUser) {
      console.error("No authenticated user found");
      return;
    }
    
    if (user.id === auth.currentUser.uid) {
      setFeedback({ message: "Você não pode excluir seu próprio usuário.", type: "error" });
      return;
    }
    
    setUserToDelete(user);
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

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-orange-500" />
          Pré-autorizar Novo Usuário
        </h3>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha Temporária</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Senha inicial"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Permissão</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="user">Usuário Comum</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="md:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full bg-orange-500 text-white py-2 px-6 rounded-lg font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
            >
              Autorizar Acesso
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => {
          console.log("Rendering user row:", user.email, "ID:", user.id);
          return (
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
                  type="button"
                  onClick={() => toggleRole(user)}
                  className="px-3 py-1 text-xs font-bold border border-gray-200 rounded-md hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Mudar para {user.role === "admin" ? "Usuário" : "Admin"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    console.log("Delete button clicked for user:", user.email);
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(user);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  style={{ cursor: 'pointer', minWidth: '40px', minHeight: '40px' }}
                  title="Excluir Usuário"
                >
                  <Trash2 className="w-5 h-5 pointer-events-none" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
        <h3 className="text-orange-800 font-bold mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Nota Importante
        </h3>
        <p className="text-orange-700 text-sm">
          A gestão de usuários é feita através da pré-autorização. Para remover completamente um usuário (incluindo o acesso de autenticação), utilize o Console do Firebase.
        </p>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 max-w-md",
              feedback.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            )}
          >
            {feedback.type === "success" ? (
              <Shield className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="font-medium">{feedback.message}</p>
            <button 
              onClick={() => setFeedback(null)}
              className="ml-2 hover:bg-white/20 p-1 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Confirmar Exclusão</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja remover o usuário <span className="font-bold text-gray-900">{userToDelete.email}</span>? 
                Esta ação excluirá o registro do banco de dados permanentemente.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
