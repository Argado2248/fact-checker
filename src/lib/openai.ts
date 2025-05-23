import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getChatGPTResponse(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4-turbo-preview",
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  return completion.choices[0].message.content || '';
}

interface FactCheckInput {
  title: string;
  content: string;
  url: string;
}

export async function generateFactCheck(article: FactCheckInput): Promise<{
  summary: string;
  verdict: string;
  factCheckScore: number;
  sources: string[];
  factCheckedContent: string;
}> {
  const prompt = `
    Du agerar som en objektiv och oberoende faktagranskare med uppdrag att analysera aktuella nyheter. Din artikel ska ha en läsetid på cirka 1-2 minuter. Följ instruktionerna nedan strikt:

    1. Inhämtning av nyhet
    Analysera följande artikel:
    Titel: ${article.title}
    Innehåll: ${article.content}
    Källa: ${article.url}

    Sammanfatta nyhetens innehåll med egna ord: ämne, centrala påståenden, tidpunkt och inblandade parter.
    OBS: Inkludera inte någon direkt kopierad text från originalartikeln. Använd endast egenformulerat språk.

    2. Faktaundersökning via externa källor
    Undersök nyhetens påståenden genom att:
    - Söka efter andra nyhetskällor som rapporterat om samma händelse
    - Notera hur många oberoende källor som bekräftar informationen
    - Bedöm källornas trovärdighet och bakgrund
    - Identifiera mönster i rapporteringen
    - Jämför olika källors rapportering för att identifiera eventuella skillnader
    - Undersök om det finns relevant historisk kontext eller bakgrundsinformation

    3. Tillförlitlighetsbedömning
    Sätt ett betyg mellan 1–100% i faktatillförlitlighet baserat på:
    - Källors mängd och trovärdighet
    - Grad av samstämmighet mellan olika källor
    - Om uppgifterna har bekräftats av officiella eller oberoende aktörer
    - Om det finns motstridiga uppgifter
    - Källornas expertis och specialisering inom ämnet

    4. Skapa en egen faktagranskad artikel
    Skriv en helt egenformulerad artikel med tydliga källhänvisningar. Artikeln ska innehålla:
    - En introduktion som sätter händelsen i kontext
    - En detaljerad genomgång av händelsen eller påståendet
    - Relevant bakgrundsinformation och historisk kontext
    - Analys av olika källor och deras rapportering
    - Tydliga källhänvisningar för viktiga påståenden
    - En sammanfattande bedömning av nyhetens tillförlitlighet
    - Eventuella viktiga perspektiv eller aspekter som saknas i originalrapporteringen

    Returnera svaret i följande JSON-format:
    {
      "summary": "En kort sammanfattning på svenska (2-3 meningar)",
      "verdict": "En av: 'Sann', 'Delvis sann', 'Osäker', 'Delvis falsk', 'Falsk'",
      "factCheckScore": "Ett nummer mellan 1-100",
      "sources": ["Lista med källor som använts för verifiering"],
      "factCheckedContent": "Den faktagranskade artikeln på svenska med källhänvisningar (målet är en läsetid på 1-2 minuter)"
    }

    OBS: Svara ENDAST med JSON-objektet ovan, utan någon ytterligare text eller formatering.
  `;

  try {
    const response = await getChatGPTResponse(prompt);
    const result = JSON.parse(response);
    
    return {
      summary: result.summary,
      verdict: result.verdict,
      factCheckScore: Number(result.factCheckScore),
      sources: Array.isArray(result.sources) ? result.sources : [result.sources],
      factCheckedContent: result.factCheckedContent
    };
  } catch (error) {
    console.error('Error generating fact check:', error);
    throw error;
  }
} 