"use client"
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { auth, db } from '../../../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Participant {
  id: string;
  nome: string;
  status: string;
  email: string;
  telefone: string;
}

const GerenciarPromocao = () => {
  const params = useParams();
  const [promotion, setPromotion] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winner, setWinner] = useState<Participant | null>(null);

  useEffect(() => {
    const loadPromotionData = async () => {
      if (!auth.currentUser) return;

      const userDoc = await getDoc(doc(db, 'usuario', auth.currentUser.uid));
      const promos = userDoc.data()?.promocoes || [];
      const currentPromo = promos.find((p: any) => p.id === params.id);

      if (currentPromo) {
        setPromotion(currentPromo);
        // Modified participant loading
        const participantsData = userDoc.data()?.participantes || [];
        const promoParticipants = participantsData
          .filter((p: any) => p.promocaoId === params.id);

        // Map to include full participant info
        const mappedParticipants = promoParticipants.map((p: any) => ({
          id: p.idParticipante,
          nome: p.nomeCompleto,
          status: p.status,
          email: p.email,
          telefone: p.telefone
        }));

        setParticipants(mappedParticipants);
      }
    };

    loadPromotionData();
  }, [params.id]);

  const handleDrawWinner = () => {
    if (participants.length === 0) return;
    const randomIndex = Math.floor(Math.random() * participants.length);
    setWinner(participants[randomIndex]);
  };

  if (!promotion) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{promotion.titulo}</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="font-semibold">Detalhes da Promoção</h2>
            <p>Tipo: {promotion.tipoPromocao}</p>
            <p>Premiação: {promotion.premiacao}</p>
            <p>Participantes: {participants.length}</p>
          </div>

          <div className="text-right">
            <button
              onClick={handleDrawWinner}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={participants.length === 0}
            >
              Realizar Sorteio
            </button>
          </div>
        </div>
      </div>

      {winner && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            Ganhador do Sorteio
          </h2>
          <p className="text-green-700">
            Nome: {winner.nome}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold p-4 border-b">
          Lista de Participantes
        </h2>
        <div className="divide-y">
          {participants.map((participant) => (
            <div key={`${participant.id}-${participant.email}`} className="p-4">
              <p>{participant.nome}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GerenciarPromocao;