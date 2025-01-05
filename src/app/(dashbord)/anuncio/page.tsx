"use client";

import React, { useState, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, arrayUnion, getDoc, arrayRemove } from "firebase/firestore";
import { db } from "../../../config/firebase";

const ImageUploadComponent = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [userImages, setUserImages] = useState<any[]>([]);

  const storage = getStorage();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchUserImages();
  }, [userId]);

  const fetchUserImages = async () => {
    if (userId) {
      const userDocRef = doc(db, "usuario", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserImages(userDoc.data().imagens || []);
      }
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) {
      alert("Por favor, selecione uma imagem.");
      return;
    }

    if (!userId) {
      alert("Usuário não autenticado. Verifique o ID.");
      return;
    }

    try {
      const storageRef = ref(storage, `imagens/${userId}/${selectedImage.name}`);
      await uploadBytes(storageRef, selectedImage);

      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, "usuario", userId);
      await updateDoc(userDocRef, {
        imagens: arrayUnion({
          imagem: downloadURL,
          link: imageUrl,
          storagePath: storageRef.fullPath,
          timestamp: new Date(),
        }),
      });

      setSelectedImage(null);
      setImageUrl("");
      fetchUserImages();
      alert("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload ou salvar dados:", error);
      alert("Erro ao enviar a imagem. Tente novamente.");
    }
  };

  const handleDeleteImage = async (image: any) => {
    if (userId) {
      try {
        const userDocRef = doc(db, "usuario", userId);
        await updateDoc(userDocRef, {
          imagens: arrayRemove(image),
        });
        const storageRef = ref(storage, image.storagePath);
        await deleteObject(storageRef);
        fetchUserImages();
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
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
            />
            {selectedImage && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Imagem selecionada:</p>
                <img src={URL.createObjectURL(selectedImage)} alt="Selected" className="mx-auto mb-4 max-h-48" />
              </div>
            )}
            <label htmlFor="file-upload" className="cursor-pointer block md:inline-block">
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
            />
          </div>
          <button
            className="mt-4 bg-blue-600 text-white px-4 md:px-6 py-2 rounded hover:bg-blue-700 text-sm md:text-base w-full md:w-auto"
            onClick={handleImageUpload}
          >
            Adicionar Imagem
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <h2 className="text-xl font-semibold mb-4">Minhas Imagens</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userImages.map((image, index) => (
              <div key={index} className="relative">
                <img src={image.imagem} alt={`Imagem ${index + 1}`} className="w-full h-48 object-cover rounded-lg" />
                <button
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  onClick={() => handleDeleteImage(image)}
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