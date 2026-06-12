interface ModalBaseProps {
    children: React.ReactNode;
    overlayClass?: string;
    cardClass?: string;
}

export function ModalBase({ children, overlayClass = 'modal-overlay', cardClass = 'modal-card' }: ModalBaseProps) {
    return (
        <div className={overlayClass}>
            <div className={cardClass}>
                {children}
            </div>
        </div>
    );
}
