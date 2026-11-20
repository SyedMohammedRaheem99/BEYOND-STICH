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

        // Only block accounts that were created with verification in place.
        // `emailVerified` is absent on documents written before that existed,
        // and those are real customers — defaulting them to "unverified"
        // would lock out everyone who signed up earlier. Explicit `false`
        // means the field was set at registration, so the gate applies.
        if (user.emailVerified === false) {
          // Checked for by the login page, which turns it into a prompt to
          // verify rather than the usual "invalid credentials".
          throw new Error('EMAIL_NOT_VERIFIED');
        }

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
          // Link Google to the existing account.
          //
          // `provider` is deliberately NOT flipped to 'google' here. It used
          // to be, which quietly broke password login for anyone who had
          // registered with a password and later used the Google button:
          // their hash was still on the document, but /api/auth/forgot-password
          // skips Google accounts, so they could neither sign in with their
          // password nor reset it. Leaving `provider` alone keeps both
          // methods working — the password hash is what decides whether
          // credentials login is possible, not this field.
          let dirty = false;
          if (!existingUser.image && user.image) {
            existingUser.image = user.image;
            dirty = true;
          }
          // Google has already proven the person controls this mailbox, so
          // signing in with it verifies the account — including one that was
          // registered with a password and never confirmed.
          if (!existingUser.emailVerified) {
            existingUser.emailVerified = true;
            existingUser.otpHash = undefined;
            existingUser.otpExpiry = undefined;
            dirty = true;
          }
          if (dirty) await existingUser.save();

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
            // Google verified the address before we ever saw it.
            emailVerified: true,
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
