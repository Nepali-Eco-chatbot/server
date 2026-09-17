import { fetchAQIAndWeatherData } from "../helpers/aqi.ts";

const cities = process.argv.slice(2);

if (cities.length === 0) {
	console.log("Usage: node scripts/verify-weather.ts <city1> [city2 ...]");
	console.log("Example: node scripts/verify-weather.ts Kathmandu Pokhara");
	process.exit(0);
}

for (const city of cities) {
	console.log(`\n${"═".repeat(52)}`);
	console.log(` CITY: ${city}`);
	console.log(`${"═".repeat(52)}`);

	const result = await fetchAQIAndWeatherData(city);

	if (!result || "error" in result) {
		console.log(`  ✗ Could not fetch data: ${result?.error ?? "unknown error"}`);
		continue;
	}

	const rows: [string, string, string][] = [
		["Location", result.location, ""],
		["AQI (US)", String(result.us_aqi), result.status_category],
		["PM2.5", `${result.pm2_5_ug_m3} µg/m³`, ""],
		["PM10", `${result.pm10_ug_m3} µg/m³`, ""],
		["CO", `${result.carbon_monoxide_ug_m3} µg/m³`, ""],
		["NO2", `${result.nitrogen_dioxide_ug_m3} µg/m³`, ""],
		["Temperature", `${result.temperature_celsius} °C`, ""],
		["Humidity", `${result.relative_humidity_percent} %`, ""],
		["Wind", `${result.wind_speed_kmh} km/h`, ""],
	];

	console.log(`  ${"─".repeat(50)}`);
	for (const [label, value, note] of rows) {
		const line = `  ${label.padEnd(13)} ${value}`;
		console.log(note ? `${line.padEnd(42)} ← ${note}` : line);
	}
	console.log(`  ${"─".repeat(50)}`);

	// Independent cross-check via wttr.in (different source, formatting only)
	try {
		const cc = await fetch(
			`https://wttr.in/${encodeURIComponent(city)}?format=j1`,
		).then((r) => (r.ok ? r.json() : null));
		if (cc) {
			const cur = cc.current_condition?.[0];
			console.log(`\n  [cross-check: wttr.in]`);
			if (cur) {
				console.log(
					`    temp ${cur.temp_C}°C | humidity ${cur.humidity}% | wind ${cur.windspeedKmph} km/h`,
				);
			}
			console.log(`    city resolved to: ${cc.nearest_area?.[0]?.areaName?.[0]?.value ?? "n/a"}`);
		} else {
			console.log(`\n  [cross-check] wttr.in unavailable for "${city}"`);
		}
	} catch {
		console.log(`\n  [cross-check] wttr.in request failed`);
	}

	console.log(
		`\n  NOTE: Open-Meteo AQI is a modeled grid estimate, not a ground sensor reading.`,
	);
}