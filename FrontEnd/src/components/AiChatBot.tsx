import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Bot, Mic, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { initLLM, detectChatIntent, askFinancialQuestion } from '../services/llmService';
import { API_BASE } from '../constants/api';
import type { Expense, RegularTransaction, Budget } from '../types';
import '../styles/AiChatBot.scss';

type Message = { id: number; text: string; sender: 'user' | 'bot' };

const HIDDEN_ROUTES = ['/', '/settings'];

export function AiChatBot() {
    const location = useLocation();

    const [userId, setUserId]       = useState('');
    const [isOpen, setIsOpen]       = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [expenses, setExpenses]                       = useState<Expense[]>([]);
    const [regularTransactions, setRegularTransactions] = useState<RegularTransaction[]>([]);
    const [budgets, setBudgets]                         = useState<Budget[]>([]);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Olá! Sou o teu assistente financeiro. Podes perguntar-me sobre os teus gastos — por exemplo: 'Quanto gastei em comida este mês?'",
            sender: 'bot',
        }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setUserId(localStorage.getItem('userId') ?? '');
    }, [location.pathname]);

    const fetchExpenses = useCallback(() => {
        const uid = localStorage.getItem('userId');
        if (!uid) return;
        fetch(`${API_BASE}/expenses/${uid}`)
            .then(r => r.json())
            .then((data: Expense[]) => setExpenses(data))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!userId || HIDDEN_ROUTES.includes(location.pathname)) return;

        initLLM().catch(console.error);

        fetch(`${API_BASE}/users/${userId}/settings`)
            .then(r => r.json())
            .then(data => {
                setRegularTransactions(data.regularTransactions ?? []);
                setBudgets(data.budgets ?? []);
            })
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
                const answer = await askFinancialQuestion(textToProcess, expenses, regularTransactions, budgets);
                addMessage(answer, 'bot');
            } else {
                addMessage('Não percebi a tua pergunta. Podes perguntar sobre os teus gastos — por exemplo: "Quanto gastei este mês?"', 'bot');
            }
        } catch (error) {
            console.error('Erro no processamento:', error);
            addMessage('Desculpa, ocorreu um erro. Podes tentar de novo?', 'bot');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error('O teu browser não suporta voz. Usa o Google Chrome!');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-PT';
        recognition.interimResults = false;

        recognition.onstart  = () => { setIsListening(true); toast.success('A ouvir... Podes falar!'); };
        recognition.onresult = (event: any) => handleSendMessage(event.results[0][0].transcript);
        recognition.onerror  = (event: any) => {
            setIsListening(false);
            if (event.error === 'not-allowed') toast.error('Acesso ao microfone bloqueado pelo browser!');
            else toast.error(`Erro de voz: ${event.error}`);
        };
        recognition.onend = () => setIsListening(false);

        try { recognition.start(); }
        catch { toast.error('Já existe uma gravação em curso.'); }
    };

    return (
        <div className="ai-fab-container">
            <div className={`ai-chat-window ${isOpen ? 'open' : ''}`}>
                <div className="chat-header">
                    <div className="header-info">
                        <div className="bot-avatar"><Bot size={22} color="#00C9DB" /></div>
                        <div className="header-titles">
                            <h3>Financial Assistant</h3>
                            <p>Ask about your expenses</p>
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
                            <div className="message-bubble loading"><Loader2 className="spin" size={16} /> A pensar...</div>
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
                        placeholder={isListening ? 'A ouvir...' : 'Ask about your expenses...'}
                        disabled={isAiLoading}
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
        </div>
    );
}
