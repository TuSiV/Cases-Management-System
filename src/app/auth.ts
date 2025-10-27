import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { UserRole, Affiliation } from '@/types'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        // 实现授权逻辑
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username,
            },
          })
          
          if (!user) {
            return null
          }
          
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            return null
          }
          
          return {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            affiliation: user.affiliation,
          }
        } catch (error) {
          console.error('登录失败:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as {
          id: string;
          role: string;
          affiliation: string;
        };
        token.id = customUser.id
        token.role = customUser.role
        token.affiliation = customUser.affiliation
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const customToken = token as {
          id: string;
          role: string;
          affiliation: string;
        };
        session.user.id = customToken.id as string
        session.user.role = customToken.role as UserRole
        session.user.affiliation = customToken.affiliation as Affiliation
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}