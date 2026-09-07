import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const koren = document.getElementById('root');
if (!koren) throw new Error('Nedostaje #root u index.html');

createRoot(koren).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
