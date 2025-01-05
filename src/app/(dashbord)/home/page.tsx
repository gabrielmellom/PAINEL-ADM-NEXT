"use client"
export default function WelcomePanel() {
  return (
    <div className="flex items-center justify-center min-h-screen text-center">
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        Bem-vindo ao Painel de Administração!
      </h1>
      
      <p className="text-gray-600 mb-4">
        Estamos felizes em tê-lo por aqui! Aqui, você pode gerenciar e personalizar 
        seu aplicativo de maneira fácil e rápida.
      </p>
      
      <p className="text-gray-600 mb-4">
        <strong className="font-medium">Clique em "Anúncios"</strong> para enviar 
        uma nova imagem e compartilhar atualizações com seus usuários.
      </p>
      
      <p className="text-gray-600">
        Explore todas as funcionalidades e aproveite ao máximo sua experiência. 
        Se precisar de ajuda, entre em contato pelo botão <strong className="font-medium">suporte!</strong>
      </p>
    </div>
    </div>
  );
}