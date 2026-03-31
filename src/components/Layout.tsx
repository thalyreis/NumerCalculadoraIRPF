import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Calculator, List, LogOut, Users } from "lucide-react";
import { cn } from "../lib/utils";

export default function Layout({ children, isAdmin }: { children: React.ReactNode; isAdmin?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Calculadora", icon: Calculator },
    { path: "/budgets", label: "Orçamentos", icon: List },
  ];

  if (isAdmin) {
    navItems.push({ path: "/users", label: "Usuários", icon: Users });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/logo.png" 
                alt="Numer Contabilidade" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden bg-orange-500 p-2 rounded-lg">
                <Calculator className="text-white w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">
                  Numer<span className="text-orange-500"></span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Contabilidade e Sistemas</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors border-b-2",
                    location.pathname === item.path
                      ? "border-orange-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-orange-600 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Numer Contabilidade e Sistemas. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
