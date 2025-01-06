"use client";

import React, { useState, useEffect } from "react";
import { Upload, Trash2, Check, AlertCircle, X } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, doc, updateDoc, arrayUnion, getDoc, arrayRemove } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../../../config/firebase";

const ImageUploadComponent = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [userImages, setUserImages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const storage = getStorage();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (currentUser) {
      fetchUserImages();
    } else {
      setUserImages([]);
    }
  }, [currentUser]);

  const fetchUserImages = async () => {
    if (!currentUser) return;

    try {
      // Usando diretamente a referência do documento do usuário
      const userDocRef = doc(db, "usuario", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const images = userDoc.data()?.imagens || [];
        // Ordenar por timestamp, considerando o formato de data do Firestore
        setUserImages(images);
      }
    } catch (error) {
      console.error("Erro ao buscar imagens:", error);
      showError("Erro ao carregar as imagens. Por favor, tente novamente.");
    }
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      showError("Por favor, selecione uma imagem.");
      return;
    }

    if (!currentUser) {
      showError("Você precisa estar autenticado para fazer upload de imagens.");
      return;
    }

    if (isUploading) {
      return;
    }

    setIsUploading(true);

    try {
      // Criar um nome único para a imagem baseado no ID do usuário
      const imagePath = `imagens/${currentUser.uid}/beauvio_${Date.now()}_${selectedImage.name}`;
      const storageRef = ref(storage, imagePath);
      await uploadBytes(storageRef, selectedImage);

      const downloadURL = await getDownloadURL(storageRef);

      // Referência direta ao documento do usuário
      const userDocRef = doc(db, "usuario", currentUser.uid);
      
      await updateDoc(userDocRef, {
        imagens: arrayUnion({
          imagem: downloadURL,
          link: imageUrl || "",
          storagePath: imagePath,
          timestamp: new Date(),
        }),
      });

      setSelectedImage(null);
      setImageUrl("");
      await fetchUserImages();
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erro ao fazer upload ou salvar dados:", error);
      showError("Erro ao enviar a imagem. Por favor, tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (image: any) => {
    if (!currentUser) return;

    try {
      // Referência direta ao documento do usuário
      const userDocRef = doc(db, "usuario", currentUser.uid);
      
      await updateDoc(userDocRef, {
        imagens: arrayRemove(image),
      });
      const storageRef = ref(storage, image.storagePath);
      await deleteObject(storageRef);
      await fetchUserImages();
    } catch (error) {
      console.error("Error deleting image:", error);
      showError("Erro ao deletar a imagem. Por favor, tente novamente.");
    }
  };

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

  const CircularProgress = () => (
    <div className="inline-block w-4 h-4 mr-2">
      <div className="w-full h-full rounded-full border-2 border-t-blue-500 border-r-blue-500 border-b-gray-200 border-l-gray-200 animate-spin"></div>
    </div>
  );

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
            <h3 className="text-lg font-medium text-gray-900">Upload Concluído!</h3>
            <p className="mt-2 text-sm text-gray-500">
              Sua imagem foi enviada com sucesso.
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <CircularProgress />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <p>Você precisa estar autenticado para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <SuccessModal />
      <ErrorModal />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Adicionar Imagem</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-8 text-center">
            <Upload className="w-8 h-8 md:w-12 md:h-12 mx-auto text-gray-400 mb-4" />
            <input
              type="file"
              className="hidden"
              id="file-upload"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setSelectedImage(file || null);
              }}
              disabled={isUploading}
            />
            {selectedImage && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Imagem selecionada:</p>
                <img 
                  src={URL.createObjectURL(selectedImage)} 
                  alt="Selected" 
                  className="mx-auto mb-4 max-h-48 object-contain"
                />
              </div>
            )}
            <label 
              htmlFor="file-upload" 
              className={`cursor-pointer block md:inline-block ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <span className="text-blue-600 hover:text-blue-800 text-sm md:text-base">
                Escolher arquivo
              </span>
              <span className="text-gray-500 ml-2 text-sm md:text-base">ou arraste aqui</span>
            </label>
          </div>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Cole o URL adicional aqui"
              className="w-full p-2 border border-gray-300 rounded text-sm md:text-base"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={isUploading}
            />
          </div>
          <button
            className={`mt-4 bg-blue-600 text-white px-4 md:px-6 py-2 rounded hover:bg-blue-700 text-sm md:text-base w-full md:w-auto flex items-center justify-center
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleImageUpload}
            disabled={isUploading}
          >
            {isUploading && <CircularProgress />}
            {isUploading ? 'Enviando...' : 'Adicionar Imagem'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Minhas Imagens</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userImages.map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image.imagem} 
                  alt={`Imagem ${index + 1}`} 
                  className="w-full h-48 object-cover rounded-lg transition-transform duration-200 group-hover:scale-[1.02]" 
                />
                <button
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteImage(image)}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadComponent;