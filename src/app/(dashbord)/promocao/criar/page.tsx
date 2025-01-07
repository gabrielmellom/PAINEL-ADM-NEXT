"use client"
import { useState, useEffect, ChangeEvent } from 'react';
import { auth, db } from '../../../../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Check, AlertCircle, X } from "lucide-react";
const storage = getStorage();

interface Promotion {
  id?: string;
  ativa?: boolean;
  titulo: string;
  tipoPromocao: string;
  dataInicio: string;
  dataFim: string;
  premiacao: string;
  regulamento: string;
  imagem: string;
  sefelSecap: string;
  participacaoIlimitada: boolean;
  usarSefelSecap: boolean;
  idcadastro: string[];
  informacoes?: string;
  ganhadores: string;
  pergunta: string;
  
}

const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 transform transition-all ease-in-out duration-300 scale-100 opacity-100">
        {children}
      </div>
    </div>
  );
};

const Promocoes: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Promotion>({
    titulo: '',
    tipoPromocao: '',
    dataInicio: '',
    dataFim: '',
    premiacao: '',
    regulamento: '',
    imagem: '',
    sefelSecap: '',
    participacaoIlimitada: false,
    usarSefelSecap: false,
    idcadastro: [],
    informacoes: '',
    ganhadores: '',
    pergunta:''
  });

  const tiposPromocao = [ 
    { value: 'qual é a Musica', label: 'Qual é a Música?' },
    { value: 'palavra Secreta', label: 'Palavra Secreta' },
    { value: 'complete Frase', label: 'Complete a Frase' },
    { value: 'numero da Sorte', label: 'Número da Sorte' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'hora Premiada', label: 'Hora Premiada' },
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = doc(db, 'usuario', currentUser.uid);
        const snapshot = await getDoc(userDoc);

        if (snapshot.exists()) {
          const data = snapshot.data() as { promocoes?: Promotion[] };
          setPromotions(data.promocoes || []);
        }
      } else {
        setUser(null);
        setPromotions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const SuccessModal = () => (
    <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
      <div className="p-6">
        <button 
          onClick={() => setShowSuccessModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <div className="mt-3 text-center">
            <h3 className="text-lg font-medium text-gray-900">Sucesso!</h3>
            <p className="mt-2 text-sm text-gray-500">
              Promoção adicionada com sucesso.
            </p>
          </div>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="mt-5 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );

  const ErrorModal = () => (
    <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)}>
      <div className="p-6">
        <button 
          onClick={() => setShowErrorModal(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center">
            <h3 className="text-lg font-medium text-gray-900">Erro</h3>
            <p className="mt-2 text-sm text-gray-500">
              {errorMessage}
            </p>
          </div>
          <button
            onClick={() => setShowErrorModal(false)}
            className="mt-5 w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const storageRef = ref(storage, `promocoes/${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
  
          setPreviewImage(downloadURL);
          setFormData(prev => ({ ...prev, imagem: downloadURL }));
        } catch (error) {
          console.error("Erro ao fazer upload da imagem:", error);
          showError("Erro ao fazer upload da imagem. Por favor, tente novamente.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPromotion = async () => {
    if (!user) {
      showError('Você precisa estar autenticado para adicionar uma promoção.');
      return;
    }
  
    if (!formData.titulo || !formData.premiacao || !formData.regulamento || !formData.tipoPromocao) {
      showError('Preencha todos os campos obrigatórios!');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
  
    try {
      const userDoc = doc(db, 'usuario', user.uid);
      const newId = doc(collection(db, 'dummy')).id;
      
      const newPromotion: Promotion = {
        ...formData,
        id: newId,
        ativa: true,
        idcadastro: []
      };
  
      await updateDoc(userDoc, {
        promocoes: arrayUnion(newPromotion),
      });
  
      setPromotions([...promotions, newPromotion]);
      setFormData({
        ativa:true,
        titulo: '',
        tipoPromocao: '',
        dataInicio: '',
        dataFim: '',
        premiacao: '',
        regulamento: '',
        imagem: '',
        sefelSecap: '',
        participacaoIlimitada: false,
        usarSefelSecap: false,
        idcadastro: [],
        informacoes: '',
        ganhadores:'',
        pergunta:'',
      });
      setPreviewImage('');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Erro ao adicionar promoção:', error);
      showError('Erro ao adicionar promoção. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SuccessModal />
      <ErrorModal />
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Cadastre uma nova promoção</h1>
      {user ? (
        <div className="bg-white rounded-xl shadow-xl p-8 space-y-6 border border-gray-200 w-full max-w-4xl">
          {/* Primeira linha: Upload de imagem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagem da Promoção
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              {previewImage ? (
                <div className="relative w-full h-48">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="rounded-lg object-contain w-full h-full"
                  />
                  <button
                    onClick={() => {
                      setPreviewImage('');
                      setFormData(prev => ({ ...prev, imagem: '' }));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors duration-200 text-xs"
                    disabled={isSubmitting}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                    Escolher Imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG até 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Segunda linha: Título, Tipo e Prêmios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                placeholder="Digite o título"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Promoção
              </label>
              <select
                name="tipoPromocao"
                value={formData.tipoPromocao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm bg-white"
                disabled={isSubmitting}
              >
                <option value="">Selecione o tipo</option>
                {tiposPromocao.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pergunta da promoção
              </label>
              <input
                type="text"
                name="pergunta"
                value={formData.pergunta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                placeholder="Ex: Qual a palavra secreta de hoje?"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prêmios
              </label>
              <input
                type="text"
                name="premiacao"
                value={formData.premiacao}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                placeholder="Digite os prêmios"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Terceira linha: Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Início da vigência
              </label>
              <input
                type="datetime-local"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fim da vigência
              </label>
              <input
                type="datetime-local"
                name="dataFim"
                value={formData.dataFim}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Quarta linha: Participação ilimitada e SEFEL/SECAP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.participacaoIlimitada}
                  onChange={(e) => setFormData(prev => ({ ...prev, participacaoIlimitada: e.target.checked }))}
                  disabled={isSubmitting}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                <span className="ml-2 text-sm text-gray-700">Participação ilimitada</span>
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.usarSefelSecap}
                  onChange={(e) => setFormData(prev => ({ ...prev, usarSefelSecap: e.target.checked }))}
                  disabled={isSubmitting}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                <span className="ml-2 text-sm text-gray-700">SEFEL/SECAP</span>
              </label>
              <input
                type="text"
                name="sefelSecap"
                value={formData.sefelSecap}
                onChange={handleChange}
                placeholder="Número SEFEL/SECAP"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm"
                disabled={!formData.usarSefelSecap || isSubmitting}
              />
            </div>
          </div>

          {/* Quinta linha: Regulamento e Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Regulamento
              </label>
              <textarea
                name="regulamento"
                value={formData.regulamento}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm resize-none shadow-sm"
                placeholder="Digite o regulamento da promoção"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Informações
              </label>
              <textarea
                name="informacoes"
                value={formData.informacoes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm resize-none shadow-sm"
                placeholder="Informações adicionais sobre a promoção"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-4 pt-4 mt-6 border-t border-gray-200">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
              disabled={isSubmitting}
            >
              Voltar
            </button>
            <button
              onClick={handleAddPromotion}
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <>
                  <div className="inline-block w-4 h-4 mr-2">
                    <div className="w-full h-full rounded-full border-2 border-t-white border-r-white border-b-transparent border-l-transparent animate-spin"></div>
                  </div>
                  Adicionando...
                </>
              ) : (
                'Adicionar Promoção'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">Faça login para gerenciar promoções.</p>
        </div>
      )}
    </div>
  );
};

export default Promocoes;