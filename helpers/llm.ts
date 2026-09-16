import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getRelevantDBRecords } from "./db";
import { generateText } from "ai";
import { SYSTEM_PROMPT } from "../llm-config";
import { getLiveAQIAndWeather } from "./aqi";

export const generateLLMResponse = async ({
	relevantRecords,
	userQuery,
	apiKey,
}: {
	relevantRecords: Exclude<Awaited<ReturnType<typeof getRelevantDBRecords>>, undefined>;
	userQuery: string;
	apiKey?: string;
}) => {
	const effectiveKey = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
	const google = createGoogleGenerativeAI({ apiKey: effectiveKey });

	const formattedChunks =
		relevantRecords.length > 0
			? relevantRecords
				.map(
					(record, index) =>
						`[chunk ${index + 1}]:
  content: ${record.content}
  document_title: ${record.document_title}
  document_description: ${record.description}
  document: ${record.link}`,
				)
				.join("\n--\n")
			: "No reference documents available.";

	const userMessage = `USER QUERY:
${userQuery}

---

REFERENCE DOCUMENTS (use only for ecology/conservation questions, NOT for AQI or weather):
${formattedChunks}

IMPORTANT: If you use the getLiveAQIAndWeather tool, you MUST provide a final response to the user after receiving the tool results.
`;

	// Try only the fastest model first
	const modelName = "gemini-3.5-flash-lite";
	try {
		console.log(`[LLM] Attempting model: ${modelName}`);
		const model = google(modelName);

		const result = await generateText({
			model,
			system: SYSTEM_PROMPT.trim(),
			tools: { getLiveAQIAndWeather },
			toolChoice: "auto",
			maxSteps: 3,
			messages: [{ role: "user", content: userMessage }],
		});

		console.log(
			`[LLM] Done: toolCalls=${result.toolCalls?.length ?? 0}` +
			` toolResults=${result.toolResults?.length ?? 0}` +
			` finishReason=${result.finishReason}` +
			` text="${result.text?.slice(0, 120)}"`,
		);

		if (result.text && result.text.trim().length > 0) {
			return result.text;
		}

		// Fallback: manually synthesize from tool results
		if (result.toolResults && result.toolResults.length > 0) {
			console.log(`[LLM] Manual synthesis fallback`);
			const liveData = result.toolResults
				.map((tr) => JSON.stringify(tr.result, null, 2))
				.join("\n");

			const synthesisMessage = `USER QUERY: ${userQuery}

LIVE ENVIRONMENTAL DATA (just fetched in real-time):
${liveData}

Answer the user's query accurately and concisely using the live data above.
`;

			const step2 = await generateText({
				model,
				system: SYSTEM_PROMPT.trim(),
				messages: [
					{ role: "user", content: userMessage },
					...result.response.messages.slice(1),
					{ role: "user", content: synthesisMessage },
				],
			});

			if (step2.text && step2.text.trim().length > 0) {
				return step2.text;
			}
		}

		return "I fetched the live air quality data but couldn't generate a response. Please try again.";
	} catch (e) {
		console.error(`[LLM] Model "${modelName}" failed:`, e);
		return "Unable to fetch live air quality data at this moment. Please try again later.";
	}
};
