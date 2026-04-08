import { CreateMLCEngine } from "@mlc-ai/web-llm";

// Escolhemos um modelo ultra-leve e rápido
const SELECTED_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

let engine: any = null;

// Função para iniciar o motor (vai descarregar o modelo na primeira vez)
export async function initializeLLM(setInitProgress?: (msg: string) => void) {
    if (engine) return engine; // Se já iniciou, não faz de novo

    try {
        engine = await CreateMLCEngine(
            SELECTED_MODEL,
            {
                initProgressCallback: (progress) => {
                    console.log(progress.text);
                    // Podes ligar isto a uma barra de loading no UI!
                    if (setInitProgress) setInitProgress(progress.text);
                }
            }
        );
        console.log("✅ WebLLM Iniciado com sucesso!");
        return engine;
    } catch (error) {
        console.error("❌ Erro ao iniciar o WebLLM:", error);
        throw error;
    }
}

export async function extractExpenseFromText(userInput: string, categories: string[], types: string[]) {
    if (!engine) throw new Error("O LLM ainda não está carregado.");

    const catString = categories.join(', ');
    const typeString = types.join(', ');
    
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const anteontem = new Date(hoje);
    anteontem.setDate(hoje.getDate() - 2);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const dataHoje = formatDate(hoje);
    const dataOntem = formatDate(ontem);
    const dataAnteontem = formatDate(anteontem);
    
    // Definimos "safeties" (redes de segurança) para o Tipo e para a Categoria
    const defaultType = types.length > 0 ? types[0] : 'One-Time';
    const defaultCategory = categories.length > 0 ? categories[0] : 'Other';

    let processedInput = userInput.toLowerCase();
    processedInput = processedInput.replace(/day before yesterday|day befor yesterday|anteontem/g, dataAnteontem);
    processedInput = processedInput.replace(/yesterday|yesteday|yesterdy|ontem/g, dataOntem);
    processedInput = processedInput.replace(/today|tody|hoje/g, dataHoje);

    const messages = [
        { 
            role: "system", 
            content: `You are a financial data extraction AI. You extract the expense details from a brief summary given by the user into a JSON object.
            
            AVAILABLE CATEGORIES: [${catString}]
            AVAILABLE TYPES: [${typeString}]
            
            RULES:
            1. "description": A short 1-5 word summary of the item. Try to mention only the item/service bought and where it was bought if possible.
            2. "category": Match the item to the MOST LOGICAL category from the list above, think about the general use of the item bought and the context and try to match it to a category. Think broadly. If nothing fits, use "${defaultCategory}".
            3. "type": If the user does NOT explicitly say "monthly", "yearly", "sub" or "subscription", you MUST forcefully use "${defaultType}". Do not assume digital goods are subscriptions.
            4. "date": Today is ${dataHoje}. Yesterday was ${dataOntem}. The day before yesterday was ${dataAnteontem}. Format: YYYY-MM-DD.
            5. "amount": Number only. Convert commas to dots (e.g., 69,99 becomes 69.99).
            
            EXAMPLE BEHAVIOR:
            Text: "Bought a banana yesterday for 2"
            Output: {"description": "Banana", "amount": 2, "category": "Food", "type": "${defaultType}", "date": "${dataOntem}"}

            Some example for each category:
            Food: Restaurants, Groceries, Coffee, Fast Food
            Transport: Gasoline, Uber, Public Transport, flights
            Entertainment: Movies, Games, Subscriptions, Events
            Health: Gym, Medicine, Doctor, Supplements
            Clothes: Shoes, Shirts, Pants, Accessories, anything related to clothing and wearable items
            Housing: Rent, Mortgage, Utilities, Furniture, Home Improvement
            
            Return ONLY a valid JSON object. No markdown, no extra text.`
        },
        { 
            role: "user", 
            content: processedInput 
        }
    ];

    const reply = await engine.chat.completions.create({
        messages,
        temperature: 0.5, 
    });

    return reply.choices[0].message.content;
}