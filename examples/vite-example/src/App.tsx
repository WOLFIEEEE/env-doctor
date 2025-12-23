// Example: Vite app using import.meta.env
// This demonstrates proper VITE_ prefix usage

import { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState<string>('Loading...');
  
  // Vite exposes VITE_ prefixed variables via import.meta.env
  const apiUrl = import.meta.env.VITE_API_URL;
  const appTitle = import.meta.env.VITE_APP_TITLE;
  
  // Built-in Vite variables
  const isDev = import.meta.env.DEV;
  const mode = import.meta.env.MODE;
  
  useEffect(() => {
    if (!apiUrl) {
      setData('Error: VITE_API_URL not configured');
      return;
    }
    
    fetch(`${apiUrl}/data`)
      .then(res => res.json())
      .then(json => setData(JSON.stringify(json, null, 2)))
      .catch(() => setData('Failed to fetch data'));
  }, [apiUrl]);
  
  return (
    <div className="app">
      <header>
        <h1>{appTitle || 'Vite App'}</h1>
        {isDev && <span className="badge">Development</span>}
      </header>
      
      <main>
        <section>
          <h2>API Response</h2>
          <pre>{data}</pre>
        </section>
        
        <section>
          <h2>Environment Info</h2>
          <dl>
            <dt>API URL</dt>
            <dd>{apiUrl || 'Not set'}</dd>
            
            <dt>Mode</dt>
            <dd>{mode}</dd>
          </dl>
        </section>
      </main>
    </div>
  );
}

export default App;

