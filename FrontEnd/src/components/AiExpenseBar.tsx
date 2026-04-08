import { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { initializeLLM, extractExpenseFromText } from './llmService';
import { ConfirmAiModal } from './ConfirmAiModal';
import '../styles/AiBar.scss';

type AiExpenseBarProps = {
  userId: string;
  categories: string[];
  expenseTypes: string[];
  onExpenseAdded: () => void;
};

export function AiExpenseBar({ userId, categories, expenseTypes, onExpenseAdded }: AiExpenseBarProps) {
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [quickInsert, setQuickInsert] = useState(false);
  const [pendingAiExpense, setPendingAiExpense] = useState<any>(null);

  const saveAiExpense = async (expenseData: any) => {
    const finalExpense = { ...expenseData, userId: userId };
    const response = await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalExpense)
    });

    if (response.ok) {
      setAiInput('');
      setPendingAiExpense(null);
      onExpenseAdded();
    } else {
      alert('Erro ao guardar a despesa.');
    }
  };

  const handleAIAssistant = async (textOverride?: string) => {
    const textToProcess = textOverride || aiInput;
    if (!textToProcess.trim()) return;
    
    setIsAiLoading(true);
    try {
     // await initializeLLM(); // O carregamento fica em background
      const respostaStr = await extractExpenseFromText(textToProcess, categories, expenseTypes);
      const cleanJsonStr = respostaStr.replace(/```json/g, '').replace(/```/g, '').trim();
      const expenseData = JSON.parse(cleanJsonStr);

      if (quickInsert) {
        await saveAiExpense(expenseData);
      } else {
        setPendingAiExpense(expenseData);
      }
    } catch (error) {
      console.error(error);
      alert('A IA não conseguiu entender. Tenta reformular a frase.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("O teu browser não suporta voz.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-PT';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setAiInput(''); 
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(transcript); 
      handleAIAssistant(transcript); // O Auto-envio por voz acontece aqui!
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="ai-bar-container">
      <div className="ai-input-group">
        <button 
          onClick={handleVoiceInput}
          disabled={isAiLoading || isListening}
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          title="Falar despesa"
        >
          <Mic size={24} />
        </button>

        <input 
          type="text" 
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder={isListening ? "A ouvir..." : "Ex: Paguei 40€ de eletricidade ontem..."}
          disabled={isAiLoading}
          className="ai-input"
        />
        
        <button 
          onClick={() => handleAIAssistant()}
          disabled={isAiLoading || !aiInput.trim()}
          className="send-btn"
        >
          {isAiLoading ? <Loader2 className="spin-anim" size={24} /> : 'Enviar'}
        </button>
      </div>
      
      <div className="ai-controls">
        <label className="quick-insert-label">
          <input type="checkbox" checked={quickInsert} onChange={(e) => setQuickInsert(e.target.checked)} />
          Quick Insert (Ignorar janela de confirmação)
        </label>
      </div>

      {pendingAiExpense && (
        <ConfirmAiModal
          aiData={pendingAiExpense}
          categories={categories}
          expenseTypes={expenseTypes}
          onClose={() => setPendingAiExpense(null)}
          onConfirm={saveAiExpense}
        />
      )}
    </div>
  );
}