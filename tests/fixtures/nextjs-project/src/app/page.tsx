// Next.js client component
'use client';

export default function Home() {
  // Client-side access (should use NEXT_PUBLIC_ prefix)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  
  // This should trigger a warning - accessing non-public var on client
  const wrongAccess = process.env.DATABASE_URL;
  
  return (
    <div>
      <p>API: {apiUrl}</p>
      <p>GA: {gaId}</p>
    </div>
  );
}

