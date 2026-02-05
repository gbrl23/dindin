import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardProvider } from './contexts/DashboardContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginView from './features/auth/LoginView';
import SignUpView from './features/auth/SignUpView';
import ProfilesView from './features/profiles/ProfilesView';
import ProfileDetailsView from './features/profiles/ProfileDetailsView';
import AddTransactionView from './features/transactions/AddTransactionView';
import DashboardView from './features/dashboard/DashboardView';
import BillsView from './features/bills/BillsView';
import CardsView from './features/cards/CardsView';
import CardInvoiceView from './features/cards/CardInvoiceView';
import TransactionsView from './features/transactions/TransactionsView';
import InvestmentsView from './features/transactions/InvestmentsView';
import GroupsView from './features/groups/GroupsView';
import GroupDetailsView from './features/groups/GroupDetailsView';
import AccountView from './features/account/AccountView';
import LandingPage from './pages/LandingPage';

import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <ThemeProvider>
      <DashboardProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/signup" element={<SignUpView />} />

            {/* Protected Routes - Wrapped in MainLayout */}
            <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardView /></MainLayout></ProtectedRoute>} />
            <Route path="/profiles" element={<ProtectedRoute><MainLayout><ProfilesView /></MainLayout></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><MainLayout><ProfileDetailsView /></MainLayout></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><MainLayout><GroupsView /></MainLayout></ProtectedRoute>} />
            <Route path="/groups/:id" element={<ProtectedRoute><MainLayout><GroupDetailsView /></MainLayout></ProtectedRoute>} />

            {/* Note: Legacy AddTransactionView is kept for Edit mode via URL, but wrapped in Layout for consistency */}
            <Route path="/add-transaction" element={<ProtectedRoute><MainLayout><AddTransactionView /></MainLayout></ProtectedRoute>} />

            <Route path="/bills" element={<ProtectedRoute><MainLayout><BillsView /></MainLayout></ProtectedRoute>} />
            <Route path="/cards" element={<ProtectedRoute><MainLayout><CardsView /></MainLayout></ProtectedRoute>} />
            <Route path="/card-invoice/:cardId" element={<ProtectedRoute><MainLayout><CardInvoiceView /></MainLayout></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><MainLayout><TransactionsView /></MainLayout></ProtectedRoute>} />
            <Route path="/investments" element={<ProtectedRoute><MainLayout><InvestmentsView /></MainLayout></ProtectedRoute>} />
            <Route path="/edit-transaction/:id" element={<ProtectedRoute><MainLayout><AddTransactionView /></MainLayout></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><MainLayout><AccountView /></MainLayout></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DashboardProvider>
    </ThemeProvider>
  )
}

export default App
