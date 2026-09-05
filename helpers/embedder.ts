import { FeatureExtractionOutput, InferenceClient } from "@huggingface/inference";

export class Embedder {
	client = new InferenceClient(process.env.HF_TOKEN);
	constructor() { }

	embed = async (chunk: string): Promise<FeatureExtractionOutput | undefined> => {
		try {
			const embedding = await this.client.featureExtraction({
				inputs: chunk,
				normalize: true,
				provider: "hf-inference",
				model: "intfloat/multilingual-e5-small",
			});

			return embedding;
		} catch (e) {
			console.error("Something went wrong while generatting embedding.", e);
		}
	};
}
