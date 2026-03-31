import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, getDocs, limit, query } from "firebase/firestore";
import { Calculator, Lock, Mail, UserPlus } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasUsers, setHasUsers] = useState(true);

  useEffect(() => {
    const checkUsers = async () => {
      try {
        const q = query(collection(db, "users"), limit(1));
        const snap = await getDocs(q);
        setHasUsers(!snap.empty);
      } catch (e) {
        // Se der erro de permissão, é porque o banco está protegido.
        // Se não houver usuários, o Firebase costuma permitir a verificação inicial 
        // ou falhar se a regra for muito restrita. 
        // Vamos assumir que se falhou e não estamos logados, permitimos a tentativa de primeiro acesso.
        setHasUsers(false); 
      }
    };
    checkUsers();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // O App.tsx cuidará de criar o documento no Firestore após o login
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed") {
        setError("O login por E-mail/Senha não está ativado no Console do Firebase. Ative-o em Authentication > Sign-in method.");
      } else if (err.code === "auth/user-not-found") {
        setError("Usuário não encontrado. Se este é o primeiro acesso, use a opção de cadastro.");
      } else if (err.code === "auth/wrong-password") {
        setError("Senha incorreta.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este email já está em uso.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Erro na autenticação: " + err.message);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="/logo.png" 
            alt="Numer Contabilidade e Sistemas" 
            className="w-24 h-24 object-contain drop-shadow-xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden bg-orange-500 p-4 rounded-2xl shadow-lg">
            <Calculator className="text-white w-12 h-12" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Numer<span className="text-orange-500">Contabilidade</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isRegistering ? "Crie sua conta de administrador" : "Acesse o sistema administrativo"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  isRegistering ? "Cadastrar Administrador" : "Entrar no Sistema"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {!hasUsers ? "Primeiro Acesso?" : "Acesso Administrativo"}
                </span>
              </div>
            </div>
            
            {!hasUsers && !isRegistering && (
              <button
                onClick={() => setIsRegistering(true)}
                className="mt-4 w-full flex justify-center items-center gap-2 py-2 px-4 border border-orange-500 rounded-md text-sm font-medium text-orange-600 hover:bg-orange-50 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Configurar Primeiro Admin
              </button>
            )}

            {isRegistering && (
              <button
                onClick={() => setIsRegistering(false)}
                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-orange-600"
              >
                Voltar para o Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
