// Example: Server-side authentication
// This file demonstrates proper secret handling

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export function signToken(payload: object): string {
  // Simulated JWT signing
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa(JWT_SECRET.slice(0, 16)); // Simplified for demo
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): object | null {
  try {
    const [, body] = token.split('.');
    return JSON.parse(atob(body));
  } catch {
    return null;
  }
}

