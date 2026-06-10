import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { initLLM, extractExpenseFromText } from '../services/llmService';
import { ConfirmAiModal } from './ConfirmAiModal';
import type { NewExpense } from '../types';
import '../styles/AiBar.scss';
import { API_BASE } from '../constants/api';

type AiExpenseBarProps = {
  userId: string;
  categories: string[];
  expenseTypes: string[];
  onExpenseAdded: () => void;
};

export function AiExpenseBar({ userId, categories, expenseTypes, onExpenseAdded }: AiExpenseBarProps) {
  const { t } = useTranslation();
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [quickInsert, setQuickInsert] = useState(false);
  const [pendingAiExpense, setPendingAiExpense] = useState<NewExpense | null>(null);

  const saveAiExpense = async (expenseData: NewExpense) => {
    const finalExpense = { ...expenseData, userId: userId };
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalExpense)
    });

    if (response.ok) {
      setAiInput('');
      setPendingAiExpense(null);
      onExpenseAdded();
    } else {
      toast.error(t('aiBar.error_save'));
    }
  };

  const handleAIAssistant = async (textOverride?: string) => {
    const textToProcess = textOverride || aiInput;
    if (!textToProcess.trim()) return;

    setIsAiLoading(true);
    initLLM().catch(console.error); // fire-and-forget: warms model in background, keywords run immediately
    try {
      const expenseData = await extractExpenseFromText(textToProcess, categories, expenseTypes);
      if (quickInsert) {
        await saveAiExpense(expenseData);
      } else {
        setPendingAiExpense(expenseData);
      }
    } catch (error) {
      console.error("Erro no processamento da IA:", error);
      toast.error(t('aiBar.error_process'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognitionImpl = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) { toast.error(t('aiBar.error_no_voice')); return; }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = 'pt-PT';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setAiInput('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
          title={t('aiBar.speak_title')}
        >
          <Mic size={24} />
        </button>

        <input 
          type="text" 
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          placeholder={isListening ? t('aiBar.listening') : t('aiBar.placeholder')}
          disabled={isAiLoading}
          className="ai-input"
        />
        
        <button 
          onClick={() => handleAIAssistant()}
          disabled={isAiLoading || !aiInput.trim()}
          className="send-btn"
        >
          {isAiLoading ? <Loader2 className="spin-anim" size={24} /> : t('aiBar.send')}
        </button>
      </div>
      
      <div className="ai-controls">
        <label className="quick-insert-label">
          <input type="checkbox" checked={quickInsert} onChange={(e) => setQuickInsert(e.target.checked)} />
          {t('aiBar.quick_insert')}
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