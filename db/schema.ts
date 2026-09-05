import { sql } from "drizzle-orm";
import { customType, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Define the Turso Vector custom type
export const float32Array = customType<{
	data: number[];
	config: { dimensions: number };
	configRequired: true;
	driverData: Buffer;
}>({
	dataType(config) {
		return `F32_BLOB(${config.dimensions})`;
	},
	fromDriver(value: Buffer) {
		return Array.from(new Float32Array(value.buffer));
	},
	toDriver(value: number[]) {
		return sql`vector32(${JSON.stringify(value)})`;
	},
});

/**
 * processed knowledge base
 */
export const pknw_base = sqliteTable("pknw_base", {
	id: int().primaryKey({ autoIncrement: true }),
	embedding: float32Array("embedding", {
		dimensions: 384, // embedding length of the model being used https://huggingface.co/intfloat/multilingual-e5-small
	}).notNull(),
	content: text().notNull(),
	page_number: int(),
	source: text().references(() => knw_sources.id, { onDelete: "cascade" }),
});

export const knw_sources_types = ["PDF", "ATRICLES", "SEARCH_SOURCE", "CSV"] as const;

// knowledge source
export const knw_sources = sqliteTable("knw_sources", {
	id: text().notNull().primaryKey(),
	title: text().notNull(),
	description: text().notNull(),
	link: text().notNull(),
	type: text({
		enum: knw_sources_types,
	})
		.default("PDF")
		.notNull(),
	site: text().notNull(),
});
