// Server-side code
const dbUrl = process.env.DATABASE_URL;
const secretKey = process.env.SECRET_API_KEY;

export function getDb() {
  return { dbUrl, secretKey };
}

