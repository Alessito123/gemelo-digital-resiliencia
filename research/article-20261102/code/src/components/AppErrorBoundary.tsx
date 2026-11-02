import React, { ErrorInfo, ReactNode } from 'react';
import { CircleAlert, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AppErrorBoundary extends React.Component<Props, State> {
  declare readonly props: Props;
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('La interfaz no pudo renderizarse', { error, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="error-fallback">
        <CircleAlert aria-hidden="true" />
        <h1>No pudimos mostrar la simulación</h1>
        <p>Tus datos no se modificaron. Recarga la aplicación para volver al último estado disponible.</p>
        <button onClick={() => window.location.reload()}><RefreshCw aria-hidden="true" /> Volver a cargar</button>
      </main>
    );
  }
}
