"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Bell, Gift, HelpCircle, Settings, Home, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = doc(db, "usuario", user.uid);
          const userSnap = await getDoc(userDoc);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            setCompanyName(userData.empresa || "");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar nome da empresa:", error);
      }
    };

    fetchCompanyName();
  }, []);

  const menuItems = [
    { icon: Home, text: "Home", path: "/home" },
    { icon: Bell, text: "Anúncios App", path: "/anuncio" },
    { icon: Gift, text: "Promoções App", path: "/promocao" },
    { icon: HelpCircle, text: "Social mídia", path: "/social" },
    { icon: Settings, text: "Configurações", path: "/config" },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <>
      {/* Overlay com blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Botão hamburger modernizado */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg hover:shadow-blue-500/50 text-white transition-all duration-300 hover:scale-105"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar com gradiente e glassmorphism */}
      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-blue-600 to-blue-800 text-white w-72 
        transform transition-all duration-300 ease-out z-30 shadow-xl
        backdrop-blur-md backdrop-saturate-150
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:relative lg:transform-none`}
      >
        <div className="p-8 flex flex-col h-full">
          {/* Header section */}
          <div className="space-y-3 mb-10 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Bem vindo!
            </h1>
            {companyName && (
              <p className="text-base text-blue-100 font-medium tracking-wide">
                {companyName}
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-3">
            {menuItems.map((item) => (
              <Link
                key={item.text}
                href={item.path}
                className="flex items-center space-x-3 p-3.5 rounded-xl 
     hover:bg-white/10 transition-all duration-150 group
     hover:shadow-lg hover:shadow-black/5 hover:scale-[1.02]"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors" />
                <span className="font-medium">{item.text}</span>
              </Link>
            ))}
          </nav>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 p-3.5 mt-8 rounded-xl
            bg-white/10 hover:bg-white/20 transition-all duration-300
            group w-full hover:shadow-lg hover:shadow-black/5"
          >
            <LogOut className="w-5 h-5 text-red-300 group-hover:text-red-200 transition-colors" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;