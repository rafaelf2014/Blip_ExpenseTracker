import { type LucideIcon } from 'lucide-react';
import '../styles/SummaryBoxes.scss';

interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  type: 'balance' | 'income' | 'expense';
}

export function SummaryCard({ title, value, change, isPositive, icon: Icon, type }: SummaryCardProps) {
  return (
    <div className="summary-card-new">
      <div className="card-top">
        <div className="text-section">
          <p className="card-label">{title}</p>
          <h3 className="card-value">{value}</h3>
        </div>
        {/* A classe do ícone muda conforme o tipo para aplicar o gradiente certo */}
        <div className={`icon-box-wrapper ${type}`}>
          <Icon className="icon-element" />
        </div>
      </div>
      
      {change && (
        <div className="card-bottom">
          <span className={`trend-tag ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
          <span className="comparison-text">vs. last month</span>
        </div>
      )}
    </div>
  );
}