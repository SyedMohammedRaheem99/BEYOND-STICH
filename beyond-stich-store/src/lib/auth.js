import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        const user = await User.findOne({ email: credentials.email.toLowerCase() })
          .select('+passwordHash')
          .lean();

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image || '',
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB();

        const existingUser = await User.findOne({ email: user.email.toLowerCase() });
        if (existingUser) {
          // Link Google to existing account
          if (existingUser.provider !== 'google') {
            existingUser.provider = 'google';
            existingUser.image = user.image || existingUser.image;
            await existingUser.save();
          }
          user.id = existingUser._id.toString();
          user.role = existingUser.role;
        } else {
          // Create new user from Google
          const newUser = await User.create({
            name: user.name,
            email: user.email.toLowerCase(),
            image: user.image || '',
            provider: 'google',
            role: 'customer',
          });
          user.id = newUser._id.toString();
          user.role = 'customer';
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'customer';
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // No fallback: this file is public, and a known secret would let anyone forge
  // a session cookie. NextAuth throws on a missing secret in production, which
  // is the behaviour we want.
  secret: process.env.NEXTAUTH_SECRET,
};
