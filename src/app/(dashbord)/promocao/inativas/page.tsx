"use client";
import { useState, useEffect } from "react";
import { auth, db, storage } from "../../../../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";

interface Participant {
  idParticipante: string;
  nomeCompleto: string;
  telefone?: string;
  premioRecebido?: boolean;
  comprovante?: string;
}

interface WinnerInfo {
  nomeCompleto: string;
  telefone?: string;
  premioRecebido?: boolean;
  comprovante?: string;
}

interface Promotion {
  id: string;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  imagem: string;
  ativa: boolean;
  ganhadores?: string[];
  dataSorteio?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void>;
  winnerName: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onConfirm, winnerName }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await onConfirm(selectedFile);
      onClose();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do documento. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Comprovante de Recebimento
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Ganhador: <span className="font-medium text-gray-900">{winnerName}</span></p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Selecione o documento comprobatório
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? "Enviando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ListaPromocoesInativas: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [winnerInfo, setWinnerInfo] = useState<Record<string, WinnerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<{ id: string; name: string } | null>(null);

  const fetchWinnerInfo = async (userId: string, winnerIds: string[]) => {
    try {
      const userDoc = doc(db, "usuario", userId);
      const snapshot = await getDoc(userDoc);
      
      if (!snapshot.exists()) return {};

      const userData = snapshot.data();
      const participantes = userData.participantes || [];
      
      const info: Record<string, WinnerInfo> = {};
      
      winnerIds.forEach(winnerId => {
        const participant = participantes.find(
          (p: any) => p.idParticipante === winnerId
        );
        info[winnerId] = {
          nomeCompleto: participant?.nomeCompleto || "Nome não encontrado",
          telefone: participant?.telefone,
          premioRecebido: participant?.premioRecebido || false,
          comprovante: participant?.comprovante
        };
      });
      
      return info;
    } catch (error) {
      console.error("Erro ao buscar informações dos ganhadores:", error);
      return {};
    }
  };

  const handleUploadAndToggle = async (ganhadorId: string, winnerName: string) => {
    setSelectedWinner({ id: ganhadorId, name: winnerName });
    setUploadModalOpen(true);
  };

  const handleConfirmUpload = async (file: File) => {
    if (!user || !selectedWinner) return;

    setUpdating(selectedWinner.id);
    
    try {
      // 1. Fazer upload do arquivo
      const fileRef = ref(storage, `comprovantes/${user.uid}/${selectedWinner.id}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      // 2. Atualizar o documento do usuário
      const userDoc = doc(db, "usuario", user.uid);
      const snapshot = await getDoc(userDoc);
      
      if (snapshot.exists()) {
        const userData = snapshot.data();
        const participantes = [...(userData.participantes || [])];
        
        const participanteIndex = participantes.findIndex(
          (p: Participant) => p.idParticipante === selectedWinner.id
        );
        
        if (participanteIndex !== -1) {
          participantes[participanteIndex] = {
            ...participantes[participanteIndex],
            premioRecebido: true,
            comprovante: downloadURL
          };
          
          await updateDoc(userDoc, { participantes });
          
          setWinnerInfo(prev => ({
            ...prev,
            [selectedWinner.id]: {
              ...prev[selectedWinner.id],
              premioRecebido: true,
              comprovante: downloadURL
            }
          }));
        }
      }
    } catch (error) {
      console.error("Erro ao processar documento:", error);
      alert("Erro ao processar documento. Tente novamente.");
    } finally {
      setUpdating(null);
      setUploadModalOpen(false);
      setSelectedWinner(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (isMounted) {
        if (currentUser) {
          setUser(currentUser);
          loadInactivePromotions(currentUser.uid);
        } else {
          setUser(null);
          setPromotions([]);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loadInactivePromotions = async (userId: string) => {
    try {
      const userDoc = doc(db, "usuario", userId);
      const snapshot = await getDoc(userDoc);

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.promocoes && Array.isArray(data.promocoes)) {
          const inactivePromos = data.promocoes.filter(
            (promo: any) => promo.ativa === false
          );
          setPromotions(inactivePromos);

          const allWinnerIds = inactivePromos
            .flatMap((promo: any) => promo.ganhadores || [])
            .filter((id: string, index: number, self: string[]) => 
              self.indexOf(id) === index
            );

          if (allWinnerIds.length > 0) {
            const info = await fetchWinnerInfo(userId, allWinnerIds);
            setWinnerInfo(info);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar promoções inativas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Faça login para ver as promoções inativas.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Promoções Encerradas</h1>
          <div className="text-sm text-gray-600">
            {promotions.length} promoção(ões) encontrada(s)
          </div>
        </div>
        
        {promotions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-gray-500 text-lg">Nenhuma promoção inativa encontrada.</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo, index) => (
              <div key={promo.id || index} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{promo.titulo}</h2>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Início: {formatDate(promo.dataInicio)}
                    </div>
                    {promo.dataSorteio && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sorteio: {formatDate(promo.dataSorteio)}
                      </div>
                    )}
                  </div>

                  {promo.ganhadores && promo.ganhadores.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Ganhadores
                      </div>
                      {promo.ganhadores.map((ganhadorId) => (
                        <div 
                          key={ganhadorId} 
                          className="bg-gray-50 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex flex-col space-y-2">
                            <span className="font-medium text-gray-900">
                              {winnerInfo[ganhadorId]?.nomeCompleto || "Buscando nome..."}
                            </span>
                            {winnerInfo[ganhadorId]?.telefone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {winnerInfo[ganhadorId]?.telefone}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 items-center">
                            <button
                              onClick={() => handleUploadAndToggle(
                                ganhadorId,
                                winnerInfo[ganhadorId]?.nomeCompleto || "Ganhador"
                              )}
                              disabled={updating === ganhadorId || winnerInfo[ganhadorId]?.premioRecebido}
                              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                winnerInfo[ganhadorId]?.premioRecebido
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                              }`}
                            >
                              {updating === ganhadorId ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Atualizando...
                                </>
                              ) : winnerInfo[ganhadorId]?.premioRecebido ? (
                                <>
                                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Prêmio Recebido
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Marcar como Recebido
                                </>
                              )}
                            </button>

                            {winnerInfo[ganhadorId]?.comprovante && (
                              <a
                                href={winnerInfo[ganhadorId]?.comprovante}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                              >
                                <svg 
                                  className="w-4 h-4 mr-1.5" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                                  />
                                </svg>
                                Ver Comprovante
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <UploadModal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedWinner(null);
          }}
          onConfirm={handleConfirmUpload}
          winnerName={selectedWinner?.name || ""}
        />
      </div>
    </div>
  );
};

export default ListaPromocoesInativas;