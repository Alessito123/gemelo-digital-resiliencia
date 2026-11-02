import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './reactApp/Platform.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import './reactApp/platform.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
          <App />
    </AppErrorBoundary>
  </StrictMode>,
);
