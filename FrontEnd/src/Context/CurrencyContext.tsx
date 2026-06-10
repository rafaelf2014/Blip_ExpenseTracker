import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

type CurrencyContextType = {
    currency: string;
    currencySymbol: string;
    formatCurrency: (amount: number | string) => string;
    setCurrency: (currency: string) => void;
};

// Símbolo + formatação por moeda. Adicionar uma moeda nova = uma linha aqui.
const CURRENCY_CONFIG: Record<string, { symbol: string; format: (n: string) => string }> = {
    EUR: { symbol: '€',  format: n => `${n} €` },
    USD: { symbol: '$',  format: n => `$${n}` },
    GBP: { symbol: '£',  format: n => `£${n}` },
    BRL: { symbol: 'R$', format: n => `R$ ${n}` },
};
const DEFAULT_CURRENCY = 'EUR';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState(() => localStorage.getItem('currency') || DEFAULT_CURRENCY);

    const setCurrency = (newCurrency: string) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('currency', newCurrency);
    };

    const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG[DEFAULT_CURRENCY];
    const formatCurrency = (amount: number | string) => config.format(Number(amount).toFixed(2));

    return (
        <CurrencyContext.Provider value={{ currency, currencySymbol: config.symbol, formatCurrency, setCurrency }}>
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