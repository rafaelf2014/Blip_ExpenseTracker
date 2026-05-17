import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Bot, Mic, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { initLLM, extractExpenseFromText, detectChatIntent, askFinancialQuestion } from '../services/llmService';
import { ConfirmAiModal } from './ConfirmAiModal';
import { API_BASE } from '../constants/api';
import type { NewExpense } from '../types';
import '../styles/AiChatBot.scss';
import { useTranslation } from 'react-i18next';

type AiChatBotProps = {
    userId: string;
    categories: string[];
    expenseTypes: string[];
    expenses: any[];
    onExpenseAdded: () => void;
};

type Message = { id: number; text: string; sender: 'user' | 'bot' };

export function AiChatBot({ userId, categories, expenseTypes, expenses, onExpenseAdded }: AiChatBotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [pendingAiExpense, setPendingAiExpense] = useState<NewExpense | null>(null);
    const { t } = useTranslation();

    const [dimensions, setDimensions] = useState({ width: 450, height: 550 });
    const isResizing = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = dimensions.width;
        const startHeight = dimensions.height;

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!isResizing.current) return;

            const deltaX = startX - moveEvent.clientX;
            const deltaY = startY - moveEvent.clientY;

            const maxHeight = window.innerHeight - 100;
            const maxWidth = window.innerWidth - 60;

            setDimensions({
                width: Math.min(Math.max(350, startWidth + deltaX), maxWidth),
                height: Math.min(Math.max(400, startHeight + deltaY), maxHeight)
            });
        };

        const onMouseUp = () => {
            isResizing.current = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // Estado para as mensagens do chat
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: t('aiChat.first_message'),
            sender: 'bot'
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fazer scroll automático para a última mensagem
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isAiLoading]);

    const addMessage = (text: string, sender: 'user' | 'bot') => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender }]);
    };

    const saveAiExpense = async (expenseData: NewExpense) => {
        const finalExpense = { ...expenseData, userId: userId };
        const response = await fetch(`${API_BASE}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalExpense)
        });

        if (response.ok) {
            setPendingAiExpense(null);
            onExpenseAdded();
            addMessage(t('aiChat.reg_message'), "bot");
        } else {
            toast.error(t('aiChat.error_saving'));
            addMessage(t('aiChat.error_savemessage'), "bot");
        }
    };

    const handleSendMessage = async (textToProcess: string) => {
        if (!textToProcess.trim()) return;

        addMessage(textToProcess, 'user');
        setInputValue('');
        setIsAiLoading(true);

        initLLM().catch(console.error); // Inicia o motor LLM em background

        try {
            const intent = detectChatIntent(textToProcess);

            if (intent === 'QUERY') {
                // PERGUNTA: Pede à IA para ler os dados e responder
                const answer = await askFinancialQuestion(textToProcess, expenses, categories);
                addMessage(answer, "bot");
            }
            else {
                // ADIÇÃO: O fluxo normal que já tinhas
                const expenseData = await extractExpenseFromText(textToProcess, categories, expenseTypes);
                setPendingAiExpense(expenseData);
                addMessage(t('aiChat.processing_message'), "bot");
            }

        } catch (error) {
            console.error(t('aiChat.error_processing'), error);
            addMessage(t('aiChat.error_understanding'), "bot");
        } finally {
            setIsAiLoading(false);
        }
    };

    // --- CORREÇÃO DO MICROFONE ---
    const handleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error(t('aiChat.error_voice'));
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-PT';
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            toast.success(t('aiChat.voice_start'));
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            handleSendMessage(transcript);
        };

        // Agora vais saber exatamente porque é que falha!
        recognition.onerror = (event: any) => {
            setIsListening(false);
            console.error(t('aiChat.error_voice_generic'), event.error);
            if (event.error === 'not-allowed') {
                toast.error(t('aiChat.error_microphone'));
            } else {
                toast.error(t('aiChat.error_voice_generic') + event.error);
            }
        };

        recognition.onend = () => setIsListening(false);

        try {
            recognition.start();
        } catch (e) {
            toast.error(t('aiChat.error_existing_recording'));
        }
    };

    return (
        <div className="ai-fab-container">
            {/* ... O Resto do teu HTML mantém-se exatamente igual à resposta anterior! ... */}
            <div className={`ai-chat-window ${isOpen ? 'open' : ''}`}
                style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}>
                <div className="resizer" onMouseDown={handleMouseDown}></div>
                <div className="chat-header">
                    <div className="header-info">
                        <div className="bot-avatar"><Bot size={22} color="#00C9DB" /></div>
                        <div className="header-titles">
                            <h3>{t('aiChat.title')} ✨</h3>
                            <p>{t('aiChat.subTitle')}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="close-btn"><X size={20} /></button>
                </div>

                <div className="chat-body">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`message-row ${msg.sender}`}>
                            {msg.sender === 'bot' && <div className="msg-avatar"><Bot size={16} /></div>}
                            <div className="message-bubble">{msg.text}</div>
                        </div>
                    ))}
                    {isAiLoading && (
                        <div className="message-row bot">
                            <div className="msg-avatar"><Bot size={16} /></div>
                            <div className="message-bubble loading"><Loader2 className="spin" size={16} /> {t('aiChat.thinking')}</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-footer">
                    <input
                        type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                        placeholder={isListening ? t('aiChat.listening') : t('aiChat.ask_placeholder')} disabled={isAiLoading}
                    />
                    <button onClick={handleVoiceInput} disabled={isAiLoading || isListening} className={`action-btn mic ${isListening ? 'listening' : ''}`}>
                        <Mic size={18} />
                    </button>
                    <button onClick={() => handleSendMessage(inputValue)} disabled={isAiLoading || !inputValue.trim()} className="action-btn send">
                        <Send size={18} />
                    </button>
                </div>
            </div>

            <button className={`fab-button ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
                <MessageSquare size={26} />
            </button>

            {pendingAiExpense && (
                <ConfirmAiModal aiData={pendingAiExpense} categories={categories} expenseTypes={expenseTypes} onClose={() => setPendingAiExpense(null)} onConfirm={saveAiExpense} />
            )}
        </div>
    );
}