'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtVerify, JWTPayload } from 'jose';

interface UserPayload extends JWTPayload {
  id: string;
  email: string;
}

const MainPage = () => {
  const [user, setUser] = useState<UserPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    if (token) {
      const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

      jwtVerify(token, secret)
        .then(({ payload }) => {
          const userPayload: UserPayload = payload as UserPayload;
          if (userPayload.id && userPayload.email) {
            setUser(userPayload);
          } else {
            throw new Error('Invalid token payload');
          }
        })
        .catch((err) => {
          console.error('Invalid token:', err);
          router.push('/');
        });
    } else {
      router.push('/');
    }
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold">Hello, {user.email}</h1> {/* Displays user-specific information */}
    </div>
  );
};

export default MainPage;
