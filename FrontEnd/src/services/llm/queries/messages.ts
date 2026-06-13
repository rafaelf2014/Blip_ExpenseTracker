// Textos de resposta do chatbot em PT e EN. Centraliza todas as strings
// para que os handlers fiquem livres de idioma e a língua seja escolhida em runtime.

export type Lang = 'en' | 'pt';

export type BudgetLine = { category: string; spent: string; limit: string; pct: number };

export type Messages = {
    allCategories: string;
    historicTotal: string;

    noIncome: string;
    incomeEstimate: (when: string, amount: string) => string;

    noBudgets: string;
    budgetStatusHeader: string;
    budgetStatusOver: string;
    budgetStatusNear: string;
    budgetStatusOk: string;

    noExpenses: (when: string) => string;
    mostUsedHeader: (when: string) => string;
    mostUsedLine: (cat: string, n: number) => string;
    distinctCategories: (n: number, when: string, list: string) => string;

    percentageNeedsCategory: string;
    noExpensesShort: (when: string) => string;
    percentageResult: (cat: string, pct: number, when: string, part: string, total: string) => string;

    noDuplicates: (when: string) => string;
    duplicatesHeader: (n: number, when: string) => string;
    duplicateLine: (amount: string, cat: string, date: string, n: number) => string;

    noExpensesInCat: (cat: string, when: string) => string;

    roundHeader: (n: number, when: string) => string;
    listMore: (n: number) => string;
    expenseLine: (desc: string, amount: string, date: string) => string;

    countResult: (n: number, cat: string, when: string) => string;
    maxResult: (when: string, desc: string, amount: string, catInfo: string) => string;
    maxCatInfo: (cat: string) => string;

    avgPerPeriod: (unit: string, cat: string, when: string, amount: string) => string;
    avgPerTransaction: (cat: string, when: string, amount: string, n: number) => string;
    unitDay: string; unitWeek: string; unitMonth: string; unitYear: string;

    listHeader: (n: number, cat: string, when: string) => string;
    listMoreExpenses: (n: number) => string;

    totalResult: (amount: string, cat: string, when: string, n: number) => string;

    // Frases do "quando" (o bocado de data das respostas acima)
    date: {
        onDate: (d: number, m: number, y: number) => string;
        inQuarter: (q: number, y: number) => string;
        lastQuarter: string;
        thisQuarter: string;
        lastNDays: (n: number) => string;
        lastNWeeks: (n: number) => string;
        lastNMonths: (n: number) => string;
        today: string;
        yesterday: string;
        lastYear: string;
        thisYear: string;
        lastMonth: string;
        thisMonth: string;
        lastWeek: string;
        thisWeek: string;
        lastWeekday: (name: string) => string;
        inMonthYear: (m: number, y: number) => string;
        inYear: (y: number) => string;
    };
};

const en: Messages = {
    allCategories: 'all categories',
    historicTotal: 'in total',

    noIncome: "You don't have regular income configured. Set it in Settings.",
    incomeEstimate: (when, amount) => `Your estimated income ${when}: ${amount}€.`,

    noBudgets: "You don't have budgets defined. Set them in Settings.",
    budgetStatusHeader: 'Your budget status:',
    budgetStatusOver: '(Exceeded!)',
    budgetStatusNear: '(Almost at the limit)',
    budgetStatusOk: '(OK)',

    noExpenses: when => `I found no expenses ${when}.`,
    mostUsedHeader: when => `Most used categories ${when}:`,
    mostUsedLine: (cat, n) => `• ${cat}: ${n} transaction(s)`,
    distinctCategories: (n, when, list) => `You used ${n} category(ies) ${when}: ${list}.`,

    percentageNeedsCategory: 'Specify a category to calculate the percentage (e.g. "percentage of food this month").',
    noExpensesShort: when => `You have no expenses ${when}.`,
    percentageResult: (cat, pct, when, part, total) => `${cat} represents ${pct}% of total spending ${when} (${part}€ of ${total}€).`,

    noDuplicates: when => `I found no duplicate transactions ${when}.`,
    duplicatesHeader: (n, when) => `I found ${n} group(s) of duplicates ${when}:`,
    duplicateLine: (amount, cat, date, n) => `• ${amount}€ in ${cat} on ${date} (${n}x)`,

    noExpensesInCat: (cat, when) => `I found no expenses in ${cat} ${when}.`,

    roundHeader: (n, when) => `${n} transaction(s) with a round amount ${when}:`,
    listMore: n => `\n... and ${n} more.`,
    expenseLine: (desc, amount, date) => `• ${desc} — ${amount}€ (${date})`,

    countResult: (n, cat, when) => `I found ${n} expense(s) in ${cat} ${when}.`,
    maxResult: (when, desc, amount, catInfo) => `The largest expense ${when}: "${desc}" at ${amount}€${catInfo}.`,
    maxCatInfo: cat => ` — category: ${cat}`,

    avgPerPeriod: (unit, cat, when, amount) => `Average spending per ${unit} in ${cat} ${when}: ${amount}€.`,
    avgPerTransaction: (cat, when, amount, n) => `Average spending per transaction in ${cat} ${when}: ${amount}€ (${n} transaction(s)).`,
    unitDay: 'day', unitWeek: 'week', unitMonth: 'month', unitYear: 'year',

    listHeader: (n, cat, when) => `${n} expense(s) in ${cat} ${when}:`,
    listMoreExpenses: n => `\n... and ${n} more expense(s).`,

    totalResult: (amount, cat, when, n) => `You spent ${amount}€ in ${cat} ${when}. (${n} record(s)).`,

    date: {
        onDate: (d, m, y) => `on ${d}/${m}/${y}`,
        inQuarter: (q, y) => `in Q${q} ${y}`,
        lastQuarter: 'last quarter',
        thisQuarter: 'this quarter',
        lastNDays: n => `in the last ${n} days`,
        lastNWeeks: n => `in the last ${n} weeks`,
        lastNMonths: n => `in the last ${n} months`,
        today: 'today',
        yesterday: 'yesterday',
        lastYear: 'last year',
        thisYear: 'this year',
        lastMonth: 'last month',
        thisMonth: 'this month',
        lastWeek: 'last week',
        thisWeek: 'this week',
        lastWeekday: name => `last ${name}`,
        inMonthYear: (m, y) => `in ${m}/${y}`,
        inYear: y => `in ${y}`,
    },
};

const pt: Messages = {
    allCategories: 'todas as categorias',
    historicTotal: 'no total histórico',

    noIncome: 'Não tens receitas regulares configuradas. Define-as nas Definições.',
    incomeEstimate: (when, amount) => `A tua receita estimada ${when}: ${amount}€.`,

    noBudgets: 'Não tens orçamentos definidos. Define-os nas Definições.',
    budgetStatusHeader: 'Estado dos teus orçamentos:',
    budgetStatusOver: '(Excedido!)',
    budgetStatusNear: '(Quase no limite)',
    budgetStatusOk: '(OK)',

    noExpenses: when => `Não encontrei despesas ${when}.`,
    mostUsedHeader: when => `Categorias mais usadas ${when}:`,
    mostUsedLine: (cat, n) => `• ${cat}: ${n} transação/ões`,
    distinctCategories: (n, when, list) => `Usaste ${n} categoria(s) ${when}: ${list}.`,

    percentageNeedsCategory: 'Especifica uma categoria para calcular a percentagem (ex: "percentage of food this month").',
    noExpensesShort: when => `Não tens despesas ${when}.`,
    percentageResult: (cat, pct, when, part, total) => `${cat} representa ${pct}% do total gasto ${when} (${part}€ de ${total}€).`,

    noDuplicates: when => `Não encontrei transações duplicadas ${when}.`,
    duplicatesHeader: (n, when) => `Encontrei ${n} grupo(s) de duplicados ${when}:`,
    duplicateLine: (amount, cat, date, n) => `• ${amount}€ em ${cat} a ${date} (${n}x)`,

    noExpensesInCat: (cat, when) => `Não encontrei despesas em ${cat} ${when}.`,

    roundHeader: (n, when) => `${n} transação/ões com montante redondo ${when}:`,
    listMore: n => `\n... e mais ${n}.`,
    expenseLine: (desc, amount, date) => `• ${desc} — ${amount}€ (${date})`,

    countResult: (n, cat, when) => `Encontrei ${n} despesa(s) em ${cat} ${when}.`,
    maxResult: (when, desc, amount, catInfo) => `A maior despesa ${when}: "${desc}" com ${amount}€${catInfo}.`,
    maxCatInfo: cat => ` — categoria: ${cat}`,

    avgPerPeriod: (unit, cat, when, amount) => `Gasto médio por ${unit} em ${cat} ${when}: ${amount}€.`,
    avgPerTransaction: (cat, when, amount, n) => `Gasto médio por transação em ${cat} ${when}: ${amount}€ (${n} transação/ões).`,
    unitDay: 'dia', unitWeek: 'semana', unitMonth: 'mês', unitYear: 'ano',

    listHeader: (n, cat, when) => `${n} despesa(s) em ${cat} ${when}:`,
    listMoreExpenses: n => `\n... e mais ${n} despesa(s).`,

    totalResult: (amount, cat, when, n) => `O teu gasto foi de ${amount}€ em ${cat} ${when}. (${n} registo/s).`,

    date: {
        onDate: (d, m, y) => `a ${d}/${m}/${y}`,
        inQuarter: (q, y) => `no Q${q} de ${y}`,
        lastQuarter: 'no último trimestre',
        thisQuarter: 'neste trimestre',
        lastNDays: n => `nos últimos ${n} dias`,
        lastNWeeks: n => `nas últimas ${n} semanas`,
        lastNMonths: n => `nos últimos ${n} meses`,
        today: 'hoje',
        yesterday: 'ontem',
        lastYear: 'no último ano',
        thisYear: 'este ano',
        lastMonth: 'no último mês',
        thisMonth: 'este mês',
        lastWeek: 'na última semana',
        thisWeek: 'esta semana',
        lastWeekday: name => `na última ${name}`,
        inMonthYear: (m, y) => `no mês ${m} de ${y}`,
        inYear: y => `no ano ${y}`,
    },
};

const TABLE: Record<Lang, Messages> = { en, pt };

export function getMessages(lang: Lang): Messages {
    return TABLE[lang] ?? pt;
}
