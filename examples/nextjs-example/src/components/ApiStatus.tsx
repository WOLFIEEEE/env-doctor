'use client';

// Example: Client-side component using NEXT_PUBLIC_ variable
// This demonstrates proper client-side env var usage

import { useEffect, useState } from 'react';

export function ApiStatus() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');
  
  // NEXT_PUBLIC_ variables are available on the client
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  useEffect(() => {
    if (!apiUrl) {
      setStatus('offline');
      return;
    }
    
    fetch(`${apiUrl}/health`)
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, [apiUrl]);
  
  return (
    <div className="api-status">
      <span>API Status: </span>
      <span className={`status-${status}`}>
        {status === 'loading' ? '...' : status}
      </span>
    </div>
  );
}

