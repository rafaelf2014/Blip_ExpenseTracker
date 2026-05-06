import { Utensils, Car, ShoppingBag, Film, Pill, Zap, DollarSign, Receipt, Briefcase } from 'lucide-react';

export function getCategoryIcon(category: string, size = 22) {
    const cat = category.toLowerCase();
    if (cat.includes('food') || cat.includes('restaurant'))                          return <Utensils size={size} />;
    if (cat.includes('transport') || cat.includes('uber') || cat.includes('gas'))   return <Car size={size} />;
    if (cat.includes('clothes') || cat.includes('shopping') || cat.includes('store')) return <ShoppingBag size={size} />;
    if (cat.includes('entertainment') || cat.includes('netflix'))                    return <Film size={size} />;
    if (cat.includes('health') || cat.includes('pharmacy'))                          return <Pill size={size} />;
    if (cat.includes('income') || cat.includes('salary'))                            return <DollarSign size={size} />;
    if (cat.includes('bills') || cat.includes('electric') || cat.includes('utilities')) return <Zap size={size} />;
    if (cat.includes('freelance') || cat.includes('work'))                           return <Briefcase size={size} />;
    return <Receipt size={size} />;
}
