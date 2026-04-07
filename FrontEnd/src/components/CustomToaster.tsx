// src/components/CustomToaster.tsx
import { Toaster } from 'react-hot-toast';

export function CustomToaster() {
    return (
        <Toaster
            position="bottom-left"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#1E293B',
                    color: '#fff',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                },
                success: {
                    iconTheme: {
                        primary: '#10B981',
                        secondary: '#1E293B',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#EF4444',
                        secondary: '#1E293B',
                    },
                },
            }}
        />
    );
}