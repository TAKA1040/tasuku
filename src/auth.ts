import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';
import { query, queryOne } from '@/lib/db/postgres-client';

// セッションに含めるユーザー情報を拡張
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// emailからDBのuser_idを取得（なければ新規作成）
async function getOrCreateUser(email: string, name?: string | null, image?: string | null): Promise<string> {
  // 既存ユーザーを検索
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing) {
    return existing.id;
  }

  // 新規ユーザーを作成
  const result = await queryOne<{ id: string }>(
    'INSERT INTO users (email, name, image) VALUES ($1, $2, $3) RETURNING id',
    [email, name, image]
  );

  return result!.id;
}

const config: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    // JWTトークンにDBのuser_idを追加
    async jwt({ token, user, account }) {
      // 初回ログイン時のみDBからuser_idを取得
      if (account && user?.email) {
        const dbUserId = await getOrCreateUser(user.email, user.name, user.image);
        token.id = dbUserId;
      }
      return token;
    },

    // セッションにユーザーIDを追加
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // セッション設定
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
