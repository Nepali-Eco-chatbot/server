import { env } from "hono/adapter";
import { TEnv } from "../types";
import { Context } from "hono";

export async function sendTypingIndicator({
	messageId,
	phoneNumberId,
	c,
}: {
	messageId: string;
	phoneNumberId: string;
	c: Context;
}) {
	const { ACCESS_TOKEN } = env<TEnv>(c);
	try {
		await fetch(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${ACCESS_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messaging_product: "whatsapp",
				status: "read",
				message_id: messageId,
				typing_indicator: {
					type: "text",
				},
			}),
		});
	} catch (e) {
		console.error("Something went wrong while sending typing indicator", e);
	}
}

export const sendFinalResponse = async ({
	messageId,
	phoneNumberId,
	phoneNumber,
	finalResponse,
	c,
}: {
	messageId: string;
	phoneNumberId: string;
	phoneNumber: string;
	finalResponse: string;
	c: Context;
}) => {
	const { ACCESS_TOKEN } = env<TEnv>(c);
	try {
		await fetch(`https://graph.facebook.com/v25.0/${phoneNumberId}/messages`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${ACCESS_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messaging_product: "whatsapp",
				recipient_type: "individual",
				to: phoneNumber,
				context: {
					message_id: messageId,
				},
				text: {
					preview_url: false,
					body: finalResponse,
				},
			}),
		});
	} catch (e) {
		console.error("Something went wrong while sending typing indicator", e);
	}
};
