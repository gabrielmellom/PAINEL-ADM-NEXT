"use client"
import React from 'react';
import { PlusCircle, Tag, ArchiveX } from "lucide-react";
import { useRouter } from 'next/navigation';

const PromocoesModal = () => {
  const router = useRouter();

  const handleNovaProcao = () => {
    router.push('/promocao/criar');
  };

  const handlePromocoesAtivas = () => {
    router.push('/promocao/ativas');
  };

  const handlePromocoesInativas = () => {
    router.push('/promocao/inativas');
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="w-96 bg-white shadow-lg rounded-lg p-4">
        <div className="p-8 space-y-6">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 tracking-tight">
            Gerenciar Promoções
          </h2>
          
          <div className="space-y-3">
            <button 
              onClick={handleNovaProcao}
              className="w-full h-16 text-lg flex items-center space-x-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200"
            >
              <PlusCircle className="w-6 h-6" />
              <span>Cadastrar Nova Promoção</span>
            </button>

            <button 
              onClick={handlePromocoesAtivas}
              className="w-full h-16 text-lg flex items-center space-x-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200"
            >
              <Tag className="w-6 h-6" />
              <span>Promoções Ativas</span>
            </button>

            <button 
              onClick={handlePromocoesInativas}
              className="w-full h-16 text-lg flex items-center space-x-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg transition-all duration-200"
            >
              <ArchiveX className="w-6 h-6" />
              <span>Promoções Inativas</span>
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center mt-4">
            Selecione uma opção para continuar
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromocoesModal;