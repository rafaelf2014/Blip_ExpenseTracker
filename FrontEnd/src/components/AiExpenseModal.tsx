import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Loader2, Zap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { initLLM, extractExpenseFromText } from '../services/llmService';
import { ConfirmAiModal } from './ConfirmAiModal';
import { ModalBase } from './ModalBase';
import type { NewExpense } from '../types';
import { API_BASE } from '../constants/api';
import '../styles/AiBar.scss';

type AiExpenseModalProps = {
  userId: string;
  categories: string[];
  expenseTypes: string[];
  onClose: () => void;
  onExpenseAdded: () => void;
};

export function AiExpenseModal({ userId, categories, expenseTypes, onClose, onExpenseAdded }: AiExpenseModalProps) {
  const { t } = useTranslation();
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [quickInsert, setQuickInsert] = useState(false);
  const [pendingAiExpense, setPendingAiExpense] = useState<NewExpense | null>(null);

  // Warm the model as soon as the user opens the menu so the first parse is fast.
  useEffect(() => { initLLM().catch(console.error); }, []);

  const saveAiExpense = async (expenseData: NewExpense) => {
    const response = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expenseData, userId }),
    });

    if (response.ok) {
      setPendingAiExpense(null);
      window.dispatchEvent(new Event('blip:expense-added'));
      onExpenseAdded();
      onClose();
    } else {
      toast.error(t('aiBar.error_save'));
    }
  };

  const processInput = async (textOverride?: string) => {
    const textToProcess = textOverride ?? aiInput;
    if (!textToProcess.trim()) return;

    setIsAiLoading(true);
    try {
      const expenseData = await extractExpenseFromText(textToProcess, categories, expenseTypes);
      if (quickInsert) {
        await saveAiExpense(expenseData);
      } else {
        setPendingAiExpense(expenseData);
      }
    } catch (error) {
      console.error('Erro no processamento da IA:', error);
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

    recognition.onstart = () => { setIsListening(true); setAiInput(''); };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(transcript);
      processInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // While reviewing the parsed result, show the confirmation modal instead.
  if (pendingAiExpense) {
    return (
      <ConfirmAiModal
        aiData={pendingAiExpense}
        categories={categories}
        expenseTypes={expenseTypes}
        onClose={() => setPendingAiExpense(null)}
        onConfirm={saveAiExpense}
      />
    );
  }

  return (
    <ModalBase overlayClass="ai-modal-overlay" cardClass="ai-menu-card">
      <button onClick={onClose} className="close-btn" aria-label="Close"><X size={22} /></button>

      <div className="ai-menu-header">
        <div className="ai-menu-icon"><Zap size={22} /></div>
        <div>
          <h3 className="modal-title">{t('aiMenu.title')}</h3>
          <p className="modal-subtitle">{t('aiMenu.subtitle')}</p>
        </div>
      </div>

      <div className="ai-input-group">
        <button
          onClick={handleVoiceInput}
          disabled={isAiLoading || isListening}
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          title={t('aiBar.speak_title')}
        >
          <Mic size={22} />
        </button>

        <input
          type="text"
          value={aiInput}
          autoFocus
          onChange={(e) => setAiInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && processInput()}
          placeholder={isListening ? t('aiBar.listening') : t('aiBar.placeholder')}
          disabled={isAiLoading}
          className="ai-input"
        />

        <button
          onClick={() => processInput()}
          disabled={isAiLoading || !aiInput.trim()}
          className="send-btn"
        >
          {isAiLoading ? <Loader2 className="spin-anim" size={22} /> : t('aiBar.send')}
        </button>
      </div>

      <label className="quick-insert-label">
        <input type="checkbox" checked={quickInsert} onChange={(e) => setQuickInsert(e.target.checked)} />
        {t('aiBar.quick_insert')}
      </label>
    </ModalBase>
  );
}
