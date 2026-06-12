import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, X, Bot, Mic, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { detectChatIntent, askFinancialQuestion } from '../services/llmService';
import { fetchExpenses as apiFetchExpenses, fetchUserSettings } from '../services/api';
import type { Expense, RegularTransaction, Budget } from '../types';
import '../styles/AiChatBot.scss';

type Message = { id: number; text: string; sender: 'user' | 'bot' };

const HIDDEN_ROUTES = ['/', '/settings'];

export function AiChatBot() {
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const lang: 'en' | 'pt' = i18n.language.startsWith('pt') ? 'pt' : 'en';

    const [userId, setUserId]       = useState('');
    const [isOpen, setIsOpen]       = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [expenses, setExpenses]                       = useState<Expense[]>([]);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
    const [budgets, setBudgets]                         = useState<Budget[]>([]);

    const [messages, setMessages] = useState<Message[]>(() => [
        { id: 1, text: t('chatbot.greeting'), sender: 'bot' },
    ]);

    // Drag-to-move: null = default anchored position (CSS); once moved, fixed coords.
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const [size, setSize] = useState<{ w: number; h: number } | null>(null);
    const windowRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{ offsetX: number; offsetY: number } | null>(null);
    const resizeState = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // On phones the window is a full-screen sheet (no drag/resize, no inline pos/size).
    const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        const onChange = () => setIsMobile(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const onDragStart = (e: React.MouseEvent) => {
        if (isMobile) return;                                        // sheet doesn't drag
        if ((e.target as HTMLElement).closest('.close-btn')) return; // let the close button click through
        const rect = windowRef.current?.getBoundingClientRect();
        if (!rect) return;
        dragState.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
        if (!pos) setPos({ x: rect.left, y: rect.top });
        e.preventDefault();
    };

    const onResizeStart = (e: React.MouseEvent) => {
        if (isMobile) return;                                        // sheet doesn't resize
        const rect = windowRef.current?.getBoundingClientRect();
        if (!rect) return;
        if (!pos) setPos({ x: rect.left, y: rect.top });
        resizeState.current = { startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height };
        e.preventDefault();
        e.stopPropagation();
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (dragState.current) {
                const w = windowRef.current?.offsetWidth ?? 360;
                const h = windowRef.current?.offsetHeight ?? 550;
                const margin = 8;
                const x = Math.min(Math.max(margin, e.clientX - dragState.current.offsetX), window.innerWidth - w - margin);
                const y = Math.min(Math.max(margin, e.clientY - dragState.current.offsetY), window.innerHeight - h - margin);
                setPos({ x, y });
            } else if (resizeState.current) {
                const { startX, startY, startW, startH } = resizeState.current;
                const w = Math.max(300, Math.min(startW + (e.clientX - startX), window.innerWidth * 0.9));
                const h = Math.max(380, Math.min(startH + (e.clientY - startY), window.innerHeight * 0.85));
                setSize({ w, h });
            }
        };
        const onUp = () => { dragState.current = null; resizeState.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []);

    useEffect(() => {
        setUserId(localStorage.getItem('userId') ?? '');
    }, [location.pathname]);

    const fetchExpenses = useCallback(() => {
        const uid = localStorage.getItem('userId');
        if (!uid) return;
        apiFetchExpenses(uid).then(setExpenses).catch(console.error);
    }, []);

    useEffect(() => {
        if (!userId || HIDDEN_ROUTES.includes(location.pathname)) return;

        fetchUserSettings(userId)
            .then(s => { setRegularTransactions(s.regularTransactions); setBudgets(s.budgets); })
            .catch(console.error);

        fetchExpenses();
    }, [userId, location.pathname, fetchExpenses]);

    useEffect(() => {
        window.addEventListener('blip:expense-added', fetchExpenses);
        return () => window.removeEventListener('blip:expense-added', fetchExpenses);
    }, [fetchExpenses]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAiLoading]);

    if (HIDDEN_ROUTES.includes(location.pathname)) return null;

    const addMessage = (text: string, sender: 'user' | 'bot') => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender }]);
    };

    const handleSendMessage = async (textToProcess: string) => {
        if (!textToProcess.trim()) return;

        addMessage(textToProcess, 'user');
        setInputValue('');
        setIsAiLoading(true);

        try {
            const intent = detectChatIntent(textToProcess);

            if (intent === 'QUERY') {
                const answer = await askFinancialQuestion(textToProcess, expenses, regularTransactions, budgets, lang);
                addMessage(answer, 'bot');
            } else {
                addMessage(t('chatbot.not_understood'), 'bot');
            }
        } catch (error) {
            console.error('Erro no processamento:', error);
            addMessage(t('chatbot.error'), 'bot');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognitionImpl = window.SpeechRecognition ?? window.webkitSpeechRecognition;

        if (!SpeechRecognitionImpl) {
            toast.error(t('chatbot.voice_unsupported'));
            return;
        }

        const recognition = new SpeechRecognitionImpl();
        recognition.lang = lang === 'pt' ? 'pt-PT' : 'en-US';
        recognition.interimResults = false;

        recognition.onstart  = () => { setIsListening(true); toast.success(t('chatbot.voice_listening')); };
        recognition.onresult = (event: SpeechRecognitionEvent) => handleSendMessage(event.results[0][0].transcript);
        recognition.onerror  = (event: SpeechRecognitionErrorEvent) => {
            setIsListening(false);
            if (event.error === 'not-allowed') toast.error(t('chatbot.voice_blocked'));
            else toast.error(t('chatbot.voice_error', { error: event.error }));
        };
        recognition.onend = () => setIsListening(false);

        try { recognition.start(); }
        catch { toast.error(t('chatbot.voice_in_progress')); }
    };

    return (
        <div className="ai-fab-container">
            <div
                ref={windowRef}
                className={`ai-chat-window ${isOpen ? 'open' : ''} ${!isMobile && pos ? 'floating' : ''}`}
                // On mobile, ignore any drag/resize state so the CSS full-screen sheet applies.
                style={isMobile ? undefined : {
                    ...(pos ? { left: pos.x, top: pos.y } : {}),
                    ...(size ? { width: size.w, height: size.h } : {}),
                }}
            >
                <div className="chat-header" onMouseDown={onDragStart}>
                    <div className="header-info">
                        <div className="bot-avatar"><Bot size={22} color="#00C9DB" /></div>
                        <div className="header-titles">
                            <h3>{t('chatbot.title')}</h3>
                            <p>{t('chatbot.subtitle')}</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="close-btn"><X size={20} /></button>
                </div>

                <div className="chat-body">
                    {messages.map(msg => (
                        <div key={msg.id} className={`message-row ${msg.sender}`}>
                            {msg.sender === 'bot' && <div className="msg-avatar"><Bot size={16} /></div>}
                            <div className="message-bubble">{msg.text}</div>
                        </div>
                    ))}
                    {isAiLoading && (
                        <div className="message-row bot">
                            <div className="msg-avatar"><Bot size={16} /></div>
                            <div className="message-bubble loading"><Loader2 className="spin" size={16} /> {t('chatbot.thinking')}</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-footer">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage(inputValue)}
                        placeholder={isListening ? t('chatbot.listening') : t('chatbot.placeholder')}
                        disabled={isAiLoading}
                    />
                    <button onClick={handleVoiceInput} disabled={isAiLoading || isListening} className={`action-btn mic ${isListening ? 'listening' : ''}`}>
                        <Mic size={18} />
                    </button>
                    <button onClick={() => handleSendMessage(inputValue)} disabled={isAiLoading || !inputValue.trim()} className="action-btn send">
                        <Send size={18} />
                    </button>
                </div>

                <div className="resize-handle" onMouseDown={onResizeStart} title="Resize" />
            </div>

            <button className={`fab-button ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
                <MessageSquare size={26} />
            </button>
        </div>
    );
}
