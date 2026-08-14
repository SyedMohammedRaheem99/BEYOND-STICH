import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// No fallback secret: this file is public, so a default would let anyone forge
// an admin token. Fail loudly at startup instead of silently being insecure.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Admin auth cannot run without it.');
}
const TOKEN_NAME = 'bs_admin_token';

/**
 * Sign a JWT for authenticated admin users
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify and decode a JWT
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Hash a plaintext password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Compare plaintext against hashed password
 */
export async function comparePassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

/**
 * Extract admin user from request cookies
 * Returns decoded token payload or null
 */
export function getAdminFromRequest(request) {
  const cookie = request.cookies.get(TOKEN_NAME);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value);
}

export { TOKEN_NAME };
