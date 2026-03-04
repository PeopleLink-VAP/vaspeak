import { GROQ_API_KEY, GROQ_MODEL } from '$env/static/private';

export interface GroqStructuredOutputOptions<T> {
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
	schema: Record<string, unknown>;
	maxTokens?: number;
	temperature?: number;
}

export async function groqStructuredOutput<T>({
	messages,
	schema,
	maxTokens = 1024,
	temperature = 0
}: GroqStructuredOutputOptions<T>): Promise<T> {
	const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${GROQ_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: GROQ_MODEL,
			messages,
			max_tokens: maxTokens,
			temperature,
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'structured_output',
					strict: true,
					schema
				}
			}
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Groq API error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	const content = data.choices[0]?.message?.content;

	if (!content) {
		throw new Error('No content in Groq response');
	}

	return JSON.parse(content) as T;
}
