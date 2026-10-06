import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Customer, Employee, Portal } from '@/lib/types';

interface AuthContextType {
  currentPortal: Portal;
  setCurrentPortal: (portal: Portal) => void;
  loggedInCustomer: Customer | null;
  loggedInEmployee: Employee | null;
  loginAsCustomer: (customerId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsEmployee: (employeeId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentPortal, setCurrentPortal] = useState<Portal>('landing');
  const [loggedInCustomer, setLoggedInCustomer] = useState<Customer | null>(null);
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const savedPortal = localStorage.getItem('novabank_portal');
    const savedCustomer = localStorage.getItem('novabank_customer');
    const savedEmployee = localStorage.getItem('novabank_employee');
    if (savedPortal) setCurrentPortal(savedPortal as Portal);
    if (savedCustomer) setLoggedInCustomer(JSON.parse(savedCustomer));
    if (savedEmployee) setLoggedInEmployee(JSON.parse(savedEmployee));
  }, []);

  const loginAsCustomer = async (customerId: string, password: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_id', customerId)
      .maybeSingle();

    if (error) return { success: false, error: 'Database error. Please try again.' };
    if (!data) return { success: false, error: 'Customer ID not found.' };
    if (data.password !== password) return { success: false, error: 'Incorrect password.' };
    if (data.account_status !== 'Active') return { success: false, error: 'Account is not active.' };

    setLoggedInCustomer(data as Customer);
    localStorage.setItem('novabank_customer', JSON.stringify(data));
    return { success: true };
  };

  const loginAsEmployee = async (employeeId: string, password: string) => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .maybeSingle();

    if (error) return { success: false, error: 'Database error. Please try again.' };
    if (!data) return { success: false, error: 'Employee ID not found.' };
    if (data.password !== password) return { success: false, error: 'Incorrect password.' };
    if (data.status !== 'Active') return { success: false, error: 'Employee account is not active.' };

    setLoggedInEmployee(data as Employee);
    localStorage.setItem('novabank_employee', JSON.stringify(data));
    return { success: true };
  };

  const logout = () => {
    setLoggedInCustomer(null);
    setLoggedInEmployee(null);
    setCurrentPortal('landing');
    localStorage.removeItem('novabank_customer');
    localStorage.removeItem('novabank_employee');
    localStorage.removeItem('novabank_portal');
  };

  const handleSetPortal = (portal: Portal) => {
    setCurrentPortal(portal);
    localStorage.setItem('novabank_portal', portal);
  };

  return (
    <AuthContext.Provider
      value={{
        currentPortal,
        setCurrentPortal: handleSetPortal,
        loggedInCustomer,
        loggedInEmployee,
        loginAsCustomer,
        loginAsEmployee,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
