"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Bell, Gift, HelpCircle, Settings, Home } from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: Home, text: "Home", path: "/home" },
    { icon: Bell, text: "Anúncios App", path: "/anuncio" },
    { icon: Gift, text: "Promoções App", path: "/promocao" },
    { icon: HelpCircle, text: "Social mídia", path: "/social" },
    { icon: Settings, text: "Configurações", path: "/config" },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-blue-600 text-white w-64 
        transform transition-transform duration-300 ease-in-out z-30
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:relative lg:transform-none`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">Bem vindo!</h1>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.text}
                href={item.path}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-700 transition-colors group"
                onClick={() => setIsOpen(false)} // Fecha a sidebar
              >
                <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.text}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
