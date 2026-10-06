import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LandingPage } from '@/components/LandingPage';
import { LoginPage } from '@/components/LoginPage';
import { CustomerPortal } from '@/components/CustomerPortal';
import { EmployeePortal } from '@/components/EmployeePortal';
import { AdminPortal } from '@/components/AdminPortal';

function AppContent() {
  const { currentPortal, loggedInCustomer, loggedInEmployee } = useAuth();

  if (currentPortal === 'landing') return <LandingPage />;

  if (currentPortal === 'customer') {
    if (!loggedInCustomer) return <LoginPage />;
    return <CustomerPortal />;
  }

  if (currentPortal === 'employee') {
    if (!loggedInEmployee) return <LoginPage />;
    return <EmployeePortal />;
  }

  if (currentPortal === 'admin') {
    if (!loggedInEmployee) return <LoginPage />;
    return <AdminPortal />;
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
