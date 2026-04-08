
import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

// Define the type for our context
type CurrencyContextType = {
    currency: string;
    currencySymbol: string;
    formatCurrency: (amount: number | string) => string;
    setCurrency: (currency: string) => void;
};

// Create the context with an undefined default value
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// component that will wrap our app and provide the currency context
export function CurrencyProvider({ children }: { children: ReactNode }) {
    // Read the initial currency from localStorage or default to 'EUR'
    const [currency, setCurrencyState] = useState(() => {
        return localStorage.getItem('currency') || 'EUR';
    });

    // Function to update the currency and save it to localStorage
    const setCurrency = (newCurrency: string) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('currency', newCurrency);
    };

    const getSymbol = () => {
        switch (currency) {
            case 'USD': return '$';
            case 'GBP': return '£';
            case 'BRL': return 'R$';
            case 'EUR':
            default: return '€';
        }
    };

    const formatCurrency = (amount: number | string) => {
        const num = Number(amount).toFixed(2);

        if (currency === 'EUR') {
            return `${num} €`;       // Símbolo à direita
        } else if (currency === 'USD') {
            return `$${num}`;        // Símbolo à esquerda
        } else if (currency === 'GBP') {
            return `£${num}`;        // Símbolo à esquerda
        } else if (currency === 'BRL') {
            return `R$ ${num}`;      // Símbolo à esquerda com espaço
        }

        return `${num} €`; // Segurança (fallback)
    };

    return (
        <CurrencyContext.Provider value={{ currency, currencySymbol: getSymbol(), formatCurrency, setCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

// Hook to use the currency context in our components
export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error('useCurrency must be used within a CurrencyProvider');
    return context;
};