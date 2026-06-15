const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const mealSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['meal_name', 'confidence', 'notes', 'items', 'totals'],
  properties: {
    meal_name: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    notes: { type: 'string' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'grams', 'calories', 'protein', 'carbs', 'fat'],
        properties: {
          name: { type: 'string' },
          grams: { type: 'number', minimum: 0 },
          calories: { type: 'number', minimum: 0 },
          protein: { type: 'number', minimum: 0 },
          carbs: { type: 'number', minimum: 0 },
          fat: { type: 'number', minimum: 0 }
        }
      }
    },
    totals: {
      type: 'object',
      additionalProperties: false,
      required: ['calories', 'protein', 'carbs', 'fat'],
      properties: {
        calories: { type: 'number', minimum: 0 },
        protein: { type: 'number', minimum: 0 },
        carbs: { type: 'number', minimum: 0 },
        fat: { type: 'number', minimum: 0 }
      }
    }
  }
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return json({ error: 'Missing OPENAI_API_KEY' }, 500);
  }

  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-5.4-mini';
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || '').trim();
  const profile = String(body.profile || '').trim();

  if (!text) {
    return json({ error: 'Missing meal text' }, 400);
  }

  const prompt = [
    'Jesteś asystentem do estymacji kalorii i makro z opisu posiłku.',
    'Zwracaj wyłącznie JSON zgodny ze schematem.',
    'Szacuj rozsądnie, jeśli opis jest niepełny. Nie zmyślaj skrajnie precyzyjnych wartości.',
    'Makro podawaj w gramach, kalorie w kcal. Uwzględnij kuchenne miary typu łyżka oleju.',
    'Jeśli opis wygląda jak przepis ze składnikami, policz sumę składników.',
    profile ? `Profil użytkownika: ${profile}.` : ''
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: prompt },
        { role: 'user', content: text }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'meal_nutrition_estimate',
          strict: true,
          schema: mealSchema
        }
      },
      reasoning: { effort: 'low' },
      store: false
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return json({ error: data.error?.message || 'OpenAI request failed' }, response.status);
  }

  const outputText = data.output_text || extractOutputText(data);
  if (!outputText) {
    return json({ error: 'OpenAI response did not include JSON text' }, 502);
  }

  return json({ result: JSON.parse(outputText) });
});

function extractOutputText(data: any): string {
  const content = data.output?.flatMap((item: any) => item.content || []) || [];
  const textPart = content.find((part: any) => part.type === 'output_text' || part.text);
  return textPart?.text || '';
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
