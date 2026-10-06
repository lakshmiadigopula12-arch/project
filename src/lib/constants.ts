export const COLORS = {
  deepTeal: '#006D77',
  mintGreen: '#83C5BE',
  aquaBlue: '#00B4D8',
  salmonPink: '#FF8A80',
};

export const CONTACT = {
  whatsappNumber: '8555058706',
  email: 'lakshmiadigopula12@gmail.com',
  emergencyPhone: '1800-123-4567',
  supportHours: '24/7 Customer Support',
};

export const BANK_INFO = {
  name: 'NovaBank',
  tagline: 'Enterprise Digital Banking & Financial Services',
  description: 'A next-generation digital banking platform built for the modern world. Secure, fast, and designed for everyone.',
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const maskAccountNumber = (accountNumber: string): string => {
  if (!accountNumber || accountNumber.length < 4) return accountNumber;
  return 'XXXX' + accountNumber.slice(-4);
};

export const maskCardNumber = (cardNumber: string): string => {
  if (!cardNumber) return cardNumber;
  return cardNumber.replace(/\d(?=\d{4})/g, '*');
};

export const generateTransactionId = (): string => {
  return 'TXN' + Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
};

export const generateReferenceNumber = (): string => {
  return 'REF' + Date.now().toString().slice(-8);
};
