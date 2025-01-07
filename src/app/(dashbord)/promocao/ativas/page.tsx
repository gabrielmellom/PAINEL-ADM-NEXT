"use client"
import { useState, useEffect } from 'react';
import { auth, db } from '../../../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface Promotion {
  id: string;
  titulo: string;
  tipoPromocao: string;
  descricao: string;
  premiacao: string;
  dataInicio: string;
  dataFim: string;
  imagem: string;
  palavraChave: string;
  participantCount?: number;
  ativa: boolean;
}

const ListaPromocoes: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const router = useRouter();

  const fetchParticipantCounts = async (promos: Promotion[], userId: string) => {
    try {
      if (!userId) {
        console.error('UserId não disponível');
        return;
      }

      const userDoc = await getDoc(doc(db, 'usuario', userId));
      if (!userDoc.exists()) return;

      const participantes = userDoc.data().participantes || [];

      const updatedPromos = promos.map(promo => ({
        ...promo,
        participantCount: participantes.filter(
          (p: any) => p.promocaoId === promo.id && p.status === 'ativa'
        ).length
      }));

      setPromotions(updatedPromos);
    } catch (error) {
      console.error('Erro ao buscar contagem de participantes:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadPromotions(currentUser.uid);
      } else {
        setUser(null);
        setPromotions([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadPromotions = async (userId: string) => {
    try {
      const userDoc = doc(db, 'usuario', userId);
      const snapshot = await getDoc(userDoc);
  
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.promocoes && Array.isArray(data.promocoes)) {
          const activePromos = data.promocoes.filter(promo => promo.ativa === true);
          setPromotions(activePromos);
          if (activePromos.length > 0) {
            await fetchParticipantCounts(activePromos, userId);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar promoções:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromotion = async (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!user) return;
  
    try {
      const userDoc = doc(db, 'usuario', user.uid);
      const docSnapshot = await getDoc(userDoc);
      
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const allPromotions = data.promocoes || [];
        
        // Get the promotion ID we want to delete
        const promotionToDelete = promotions[index].id;
        
        // Find and update the correct promotion in the full array
        const updatedPromotions = allPromotions.map((p: any) => 
          p.id === promotionToDelete ? { ...p, ativa: false } : p
        );
  
        await updateDoc(userDoc, {
          promocoes: updatedPromotions
        });
  
        // Update local state
        setPromotions(promotions.filter((_, i) => i !== index));
        setShowConfirmDelete(null);
      }
    } catch (error) {
      console.error('Erro ao deletar promoção:', error);
      alert('Erro ao deletar promoção. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Carregando promoções...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">Faça login para ver as promoções.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
            Promoções Disponíveis
          </h1>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded">
            {promotions.length} promoções
          </span>
        </div>

        {promotions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">Nenhuma promoção encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promotions.map((promo, index) => (
              <div
                key={index}
                onClick={() => router.push(`/promocao/${promo.id}`)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="p-4">
                  <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4">
                    {promo.imagem ? (
                      <img
                        src={promo.imagem}
                        alt={promo.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <h2 className="text-lg font-semibold text-gray-800 line-clamp-2">
                        {promo.titulo}
                      </h2>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDelete(index);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 mr-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="truncate">
                        {new Date(promo.dataInicio).toLocaleDateString('pt-BR')} até{' '}
                        {new Date(promo.dataFim).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {promo.tipoPromocao === 'senha' ? 'Senha Única' :
                         promo.tipoPromocao === 'palavras' ? '2 ou Mais Palavras' : 
                         'Questionamento'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {promo.participantCount || 0} Participantes
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Premiação:</span> {promo.premiacao}
                    </div>
                  </div>
                </div>

                {showConfirmDelete === index && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Confirmar Exclusão
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Tem certeza que deseja deletar esta promoção? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowConfirmDelete(null);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors w-full sm:w-auto"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={(e) => handleDeletePromotion(e, index)}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors w-full sm:w-auto"
                        >
                          Deletar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaPromocoes;