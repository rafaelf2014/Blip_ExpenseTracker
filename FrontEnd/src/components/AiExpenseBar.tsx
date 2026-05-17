import { useState } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { initLLM, extractExpenseFromText } from '../services/llmService';
import { ConfirmAiModal } from './ConfirmAiModal';
import type { NewExpense } from '../types';
import '../styles/AiBar.scss';
import { API_BASE } from '../constants/api';
import { useTranslation } from 'react-i18next';

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
  const [pendingAiExpense, setPendingAiExpense] = useState<NewExpense | null>(null);
  const { t } = useTranslation();

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
      toast.error(t('aiExpenseBar.error_saving'));
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
      console.error(t('aiExpenseBar.error_processing'), error);
      toast.error(t('aiExpenseBar.error'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error(t('aiExpenseBar.error_voice')); return; }

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
          placeholder={isListening ? t('aiExpenseBar.listening') : t('aiExpenseBar.placeholder')}
          disabled={isAiLoading}
          className="ai-input"
        />

        <button
          onClick={() => handleAIAssistant()}
          disabled={isAiLoading || !aiInput.trim()}
          className="send-btn"
        >
          {isAiLoading ? <Loader2 className="spin-anim" size={24} /> : t('aiExpenseBar.button_send')}
        </button>
      </div>

      <div className="ai-controls">
        <label className="quick-insert-label">
          <input type="checkbox" checked={quickInsert} onChange={(e) => setQuickInsert(e.target.checked)} />
          {t('aiExpenseBar.quick_insert')}
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