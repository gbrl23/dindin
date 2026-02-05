import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './contexts/AuthContext'
import { CardsProvider } from './contexts/CardsContext'
import { TransactionsProvider } from './contexts/TransactionsContext'
import { GoalsProvider } from './contexts/GoalsContext'
import './styles/index.css'

console.log('App mounting...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CardsProvider>
        <TransactionsProvider>
          <GoalsProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </GoalsProvider>
        </TransactionsProvider>
      </CardsProvider>
    </AuthProvider>
  </React.StrictMode>,
)
