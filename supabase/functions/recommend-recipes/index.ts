import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const recipeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'suggestions'],
  properties: {
    summary: { type: 'string' },
    suggestions: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'fit_reason', 'meal_type', 'calories', 'protein', 'carbs', 'fat', 'time', 'ingredients', 'steps'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          fit_reason: { type: 'string' },
          meal_type: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
          calories: { type: 'number', minimum: 0 },
          protein: { type: 'number', minimum: 0 },
          carbs: { type: 'number', minimum: 0 },
          fat: { type: 'number', minimum: 0 },
          time: { type: 'number', minimum: 0 },
          ingredients: {
            type: 'array',
            minItems: 3,
            maxItems: 12,
            items: { type: 'string' }
          },
          steps: {
            type: 'array',
            minItems: 2,
            maxItems: 8,
            items: { type: 'string' }
          }
        }
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

  const auth = await requireUser(request);
  if ('response' in auth) return auth.response;

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return json({ error: 'Missing OPENAI_API_KEY' }, 500);
  }

  const model = Deno.env.get('OPENAI_RECIPE_MODEL') || Deno.env.get('OPENAI_MODEL') || 'gpt-5.4-mini';
  const body = await request.json().catch(() => ({}));
  const context = sanitizeContext(body.context);
  if (!context) {
    return json({ error: 'Missing recipe context' }, 400);
  }

  const prompt = [
    'Jestes dietetycznym asystentem przepisow dla aplikacji Dziennik Diety.',
    'Dostajesz maly kontekst RAG: cele, preferencje, ostatnie posilki i znalezione przepisy uzytkownika.',
    'Wygeneruj praktyczne, latwe do zapisania przepisy po polsku.',
    'Nie uzywaj skladnikow wykluczonych. Jesli uzytkownik czegos nie lubi, unikaj tego.',
    'Dopasuj kcal i makro do celu uzytkownika. Dla redukcji preferuj syte, wysokobialkowe porcje.',
    'Nie dawaj porad medycznych. Zwracaj wylacznie JSON zgodny ze schematem.'
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
        { role: 'user', content: JSON.stringify(context) }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'personalized_recipe_recommendations',
          strict: true,
          schema: recipeSchema
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

async function requireUser(request: Request): Promise<{ user: any } | { response: Response }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return { response: json({ error: 'Missing Supabase environment' }, 500) };
  }

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { response: json({ error: 'Missing authorization token' }, 401) };
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: { Authorization: `Bearer ${token}` }
    }
  }) as any;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { response: json({ error: 'Invalid authorization token' }, 401) };
  }
  return { user: data.user };
}

function sanitizeContext(context: unknown): unknown {
  if (!context || typeof context !== 'object' || Array.isArray(context)) return null;
  const text = JSON.stringify(context);
  if (text.length > 16000) {
    return { truncated: true, payload: text.slice(0, 16000) };
  }
  return context;
}

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
