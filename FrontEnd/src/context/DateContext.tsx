import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

type DateContextType = {
    dateFormat: string;
    setDateFormat: (format: string) => void;
    formatDate: (dateString: string) => string;
};

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
    const [dateFormat, setDateFormatState] = useState(() => {
        return localStorage.getItem('dateFormat') || 'DD/MM/YYYY';
    });

    const setDateFormat = (newFormat: string) => {
        setDateFormatState(newFormat);
        localStorage.setItem('dateFormat', newFormat);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) throw new Error('Invalid date');
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            switch (dateFormat) {
                case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
                case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
                case 'DD/MM/YYYY':
                default: return `${day}/${month}/${year}`;
            }
        } catch {
            return dateString.split('T')[0].split(' ')[0];
        }
    };

    return (
        <DateContext.Provider value={{ dateFormat, setDateFormat, formatDate }}>
            {children}
        </DateContext.Provider>
    );
}

export const useDate = () => {
    const context = useContext(DateContext);
    if (!context) throw new Error('useDate must be used within a DateProvider');
    return context;
};
