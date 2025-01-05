import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from 'firebase/auth';

export const config = {
    matcher: [
     
  
      // Proteção específica para pastas principais e suas subpastas
      '/dashboard/:home*',
      '/promocao/:path*',
      '/components/:path*'
    ]
  };
  
  export async function middleware(request: NextRequest) {
    const auth = getAuth();
    const user = auth.currentUser;
  
    // Se não estiver autenticado, redireciona para o login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  
    return NextResponse.next();
  }