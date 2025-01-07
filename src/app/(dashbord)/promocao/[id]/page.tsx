"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { auth, db } from '../../../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Participant {
  id: string;
  nome: string;
  status: string;
  email: string;
  telefone: string;
}

interface Winner extends Participant {
  dataSorteio: string;
}

const GerenciarPromocao = () => {
  const params = useParams();
  const [promotion, setPromotion] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showWinnerActions, setShowWinnerActions] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadPromotionData();
    }
  }, [params.id]);

  const loadPromotionData = async () => {
    if (!auth.currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'usuario', auth.currentUser.uid));
      const promos = userDoc.data()?.promocoes || [];
      const currentPromo = promos.find((p: any) => p.id === params.id);

      if (currentPromo) {
        setPromotion(currentPromo);
        const participantsData = userDoc.data()?.participantes || [];
        const promoParticipants = participantsData
          .filter((p: any) => p.promocaoId === params.id);

        const mappedParticipants = promoParticipants.map((p: any) => ({
          id: p.idParticipante,
          nome: p.nomeCompleto,
          status: p.status,
          email: p.email,
          telefone: p.telefone
        }));

        setParticipants(mappedParticipants);
        
        if (Array.isArray(currentPromo.ganhadores)) {
          const winnersList = mappedParticipants
            .filter((participant: Participant) => 
              currentPromo.ganhadores.includes(participant.id)
            )
            .map((winner: Participant): Winner => ({
              ...winner,
              dataSorteio: currentPromo.datasSorteio?.[winner.id] || ''
            }));
          setWinners(winnersList);
        } else {
          setWinners([]);
        }
      }
    } catch (error) {
      console.error('Error loading promotion data:', error);
      setWinners([]);
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        spread: 90,
        gravity: 0.8,
        scalar: 1.2,
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const handleDrawWinner = () => {
    if (participants.length === 0 || loading || countdown !== null) return;
    
    setCountdown(3);
    setCurrentWinner(null);
    setShowWinnerActions(false);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          drawNewWinner();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const drawNewWinner = async () => {
    try {
      const availableParticipants = participants.filter(
        participant => !promotion.ganhadores?.includes(participant.id)
      );

      if (availableParticipants.length === 0) {
        alert('Não há mais participantes disponíveis para sorteio!');
        return;
      }

      const randomIndex = Math.floor(Math.random() * availableParticipants.length);
      const drawn = availableParticipants[randomIndex];
      const dataSorteio = new Date().toISOString();
      const newWinner: Winner = {
        ...drawn,
        dataSorteio: new Date(dataSorteio).toLocaleDateString()
      };
      
      if (auth.currentUser) {
        const userDocRef = doc(db, 'usuario', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const promos = userDoc.data()?.promocoes || [];
        
        const updatedPromos = promos.map((p: any) => {
          if (p.id === params.id) {
            const currentGanhadores = Array.isArray(p.ganhadores) ? p.ganhadores : [];
            return {
              ...p,
              ganhadores: [...currentGanhadores, drawn.id],
              datasSorteio: {
                ...(p.datasSorteio || {}),
                [drawn.id]: dataSorteio
              }
            };
          }
          return p;
        });

        await updateDoc(userDocRef, {
          promocoes: updatedPromos
        });

        await loadPromotionData();
      }

      setCurrentWinner(newWinner);
      setShowWinnerActions(true);
      
      // Dispara os confetes após definir o ganhador
      triggerConfetti();
      
    } catch (error) {
      console.error('Error updating winners:', error);
    }
  };

  const handleDeactivatePromotion = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const userDocRef = doc(db, 'usuario', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const promos = userDoc.data()?.promocoes || [];
      
      const updatedPromos = promos.map((p: any) => {
        if (p.id === params.id) {
          return { 
            ...p, 
            ativa: false
          };
        }
        return p;
      });

      await updateDoc(userDocRef, {
        promocoes: updatedPromos
      });

      setPromotion((prev: any) => ({ ...prev, ativa: false }));
    } catch (error) {
      console.error('Error deactivating promotion:', error);
    }

    setLoading(false);
    setShowWinnerActions(false);
  };

  if (!promotion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          {promotion.imagem && (
            <img
              src={promotion.imagem}
              alt={promotion.titulo}
              className="w-full h-full object-cover opacity-75"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70">
            <h1 className="text-2xl font-bold text-white mb-1">{promotion.titulo}</h1>
            <p className="text-white/90">Tipo: {promotion.tipoPromocao}</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="font-semibold text-lg text-gray-800 mb-2">Detalhes da Promoção</h2>
                <div className="space-y-2 text-gray-600">
                  <p>Premiação: {promotion.premiacao}</p>
                  <p>Status: {promotion.ativa ? 
                    <span className="text-green-600 font-medium">Ativa</span> : 
                    <span className="text-red-600 font-medium">Inativa</span>
                  }</p>
                  <p>Total de Participantes: {participants.length}</p>
                  <p>Total de Sorteios Realizados: {winners.length}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              {promotion.ativa ? (
                <div className="text-center">
                  {countdown !== null && (
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-blue-600 animate-pulse">
                        {countdown}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleDrawWinner}
                    disabled={participants.length === 0 || loading || countdown !== null}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processando...' : 'Realizar Sorteio'}
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-red-600 font-medium">Esta promoção está inativa</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Winner Section */}
          {currentWinner && (
            <div className="mb-6 bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 p-1.5 rounded-md">
                  <Gift className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-emerald-800">
                  Ganhador do Sorteio
                </h2>
              </div>

              <div className="space-y-3 mb-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Nome do Ganhador:</p>
                  <p className="text-xl font-bold text-emerald-800">{currentWinner.nome}</p>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Email para Contato:</p>
                  <p className="text-sm text-emerald-800">{currentWinner.email}</p>
                </div>
              </div>
              
              {showWinnerActions && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleDrawWinner}
                    className="px-4 py-2 rounded-lg bg-white text-emerald-700 font-medium border border-emerald-200 hover:bg-emerald-50 text-sm"
                  >
                    Realizar Outro Sorteio
                  </button>
                  <button
                    onClick={handleDeactivatePromotion}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 text-sm"
                  >
                    Inativar Promoção
                  </button>
                </div>
              )}
            </div>
          )}
          

          {/* Winners History */}
          <div className="bg-white rounded-xl border">
            <h2 className="text-xl font-semibold p-4 border-b flex items-center gap-2">
              <Gift className="w-5 h-5" /> Ganhadores da Promoção
            </h2>
            <div className="divide-y">
              {winners.length > 0 ? (
                winners.map((winner, index) => (
                  <div 
                    key={`${winner.id}-${winner.email}-${index}`} 
                    className="p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-blue-500" />
                      <div className="grid gap-1">
                        <p className="font-medium">{winner.nome}</p>
                        <p className="text-sm text-gray-500">{winner.email}</p>
                        <p className="text-sm text-gray-500">{winner.telefone}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Sorteado em: {winner.dataSorteio}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Nenhum sorteio realizado ainda
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GerenciarPromocao;