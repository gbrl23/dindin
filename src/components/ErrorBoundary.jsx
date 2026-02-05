import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>
                    <h1>Algo deu errado.</h1>
                    <p>Tente recarregar a página.</p>
                    <pre style={{ textAlign: 'left', background: '#000', padding: '20px', borderRadius: '8px', overflow: 'auto', marginTop: '20px' }}>
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        style={{ marginTop: '20px', padding: '10px 20px', background: 'red', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                        Resetar App (Limpar Dados)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
