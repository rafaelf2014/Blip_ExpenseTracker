import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Bot, Mic, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { initLLM, extractExpenseFromText, detectChatIntent, askFinancialQuestion } from '../services/llmService';
import { ConfirmAiModal } from './ConfirmAiModal';
import { API_BASE } from '../constants/api';
import type { NewExpense } from '../types';
import '../styles/AiChatBot.scss';

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

    // Estado para as mensagens do chat
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Olá! Sou o teu assistente financeiro IA. Posso ajudar-te a registar despesas rapidamente. Tenta dizer algo como: 'Paguei 40€ de eletricidade ontem'.",
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
            addMessage("Despesa registada com sucesso! 🚀", "bot");
        } else {
            toast.error('Erro ao guardar a despesa.');
            addMessage("Ocorreu um erro ao tentar guardar a despesa.", "bot");
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
                addMessage("Analisei o teu pedido. Por favor, confirma os dados no ecrã.", "bot");
            }

        } catch (error) {
            console.error("Erro no processamento da IA:", error);
            addMessage("Desculpa, não consegui entender o teu pedido. Podes tentar de novo?", "bot");
        } finally {
            setIsAiLoading(false);
        }
    };

    // --- CORREÇÃO DO MICROFONE ---
    const handleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            toast.error("O teu browser não suporta voz. Usa o Google Chrome!");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-PT';
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            toast.success("A ouvir... Podes falar!");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            handleSendMessage(transcript);
        };

        // Agora vais saber exatamente porque é que falha!
        recognition.onerror = (event: any) => {
            setIsListening(false);
            console.error("Erro no microfone:", event.error);
            if (event.error === 'not-allowed') {
                toast.error("Acesso ao microfone bloqueado pelo browser!");
            } else {
                toast.error(`Erro de voz: ${event.error}`);
            }
        };

        recognition.onend = () => setIsListening(false);

        try {
            recognition.start();
        } catch (e) {
            toast.error("Já existe uma gravação em curso.");
        }
    };

    return (
        <div className="ai-fab-container">
            {/* ... O Resto do teu HTML mantém-se exatamente igual à resposta anterior! ... */}
            <div className={`ai-chat-window ${isOpen ? 'open' : ''}`}>

                <div className="chat-header">
                    <div className="header-info">
                        <div className="bot-avatar"><Bot size={22} color="#00C9DB" /></div>
                        <div className="header-titles">
                            <h3>AI Assistant ✨</h3>
                            <p>Always online</p>
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
                            <div className="message-bubble loading"><Loader2 className="spin" size={16} /> A pensar...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-footer">
                    <input
                        type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                        placeholder={isListening ? "A ouvir..." : "Ask about your expenses..."} disabled={isAiLoading}
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