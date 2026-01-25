import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    handleReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 border border-red-100 text-center">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Ops! Algo deu errado</h1>
                        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                            O sistema encontrou um erro inesperado. Isso pode ser causado por dados antigos no seu navegador.
                            Clique no botão abaixo para resetar os dados e tentar novamente.
                        </p>

                        <div className="bg-red-50 p-4 rounded-xl mb-8 text-left overflow-auto max-h-32 font-mono text-[10px] text-red-800">
                            {this.state.error?.toString()}
                        </div>

                        <button
                            onClick={this.handleReset}
                            className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            <RefreshCcw size={20} /> Resetar e Recarregar
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full mt-3 py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors text-sm"
                        >
                            Apenas Recarregar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
