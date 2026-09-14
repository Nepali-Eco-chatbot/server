import { tool } from "ai";
import { z } from "zod";

interface CityCoords {
	name: string;
	lat: number;
	lon: number;
}

const NEPAL_CITIES: Record<string, CityCoords> = {
	kathmandu: { name: "Kathmandu", lat: 27.7172, lon: 85.324 },
	pokhara: { name: "Pokhara", lat: 28.2096, lon: 83.9856 },
	lalitpur: { name: "Lalitpur", lat: 27.6644, lon: 85.3188 },
	patan: { name: "Lalitpur (Patan)", lat: 27.6644, lon: 85.3188 },
	bhaktapur: { name: "Bhaktapur", lat: 27.671, lon: 85.4298 },
	chitwan: { name: "Chitwan (Bharatpur)", lat: 27.6784, lon: 84.4374 },
	bharatpur: { name: "Bharatpur", lat: 27.6784, lon: 84.4374 },
	biratnagar: { name: "Biratnagar", lat: 26.4525, lon: 87.2718 },
	dharan: { name: "Dharan", lat: 26.8124, lon: 87.2834 },
	butwal: { name: "Butwal", lat: 27.7006, lon: 83.4484 },
	hetauda: { name: "Hetauda", lat: 27.4286, lon: 85.0322 },
	nepalgunj: { name: "Nepalgunj", lat: 28.05, lon: 81.6167 },
	birgunj: { name: "Birgunj", lat: 27.0, lon: 84.8667 },
	janakpur: { name: "Janakpur", lat: 26.7288, lon: 85.9248 },
	surkhet: { name: "Surkhet (Birendranagar)", lat: 28.6, lon: 81.6333 },
	birendranagar: { name: "Birendranagar", lat: 28.6, lon: 81.6333 },
	dhangadhi: { name: "Dhangadhi", lat: 28.6833, lon: 80.6 },
};

function getCityCoords(locationQuery: string): CityCoords {
	const normalized = locationQuery.toLowerCase().trim();
	for (const key of Object.keys(NEPAL_CITIES)) {
		if (normalized.includes(key)) {
			return NEPAL_CITIES[key];
		}
	}
	return NEPAL_CITIES["kathmandu"];
}

function getAQICategory(usAqi: number): { category: string; advice: string } {
	if (usAqi <= 50) {
		return {
			category: "Good (सफा / राम्रो)",
			advice: "Air quality is satisfactory and poses little or no risk.",
		};
	} else if (usAqi <= 100) {
		return {
			category: "Moderate (मध्यम)",
			advice: "Air quality is acceptable. Sensitive individuals should consider limiting prolonged outdoor exertion.",
		};
	} else if (usAqi <= 150) {
		return {
			category: "Unhealthy for Sensitive Groups (संवेदनशील समूहका लागि अस्वस्थ)",
			advice: "Members of sensitive groups (children, elderly, asthmatics) may experience health effects. General public is less likely to be affected.",
		};
	} else if (usAqi <= 200) {
		return {
			category: "Unhealthy (अस्वस्थ)",
			advice: "Everyone may begin to experience health effects. Wearing masks and avoiding outdoor activities is recommended.",
		};
	} else if (usAqi <= 300) {
		return {
			category: "Very Unhealthy (धेरै अस्वस्थ)",
			advice: "Health alert: everyone may experience more serious health effects. Stay indoors and use air purifiers if available.",
		};
	} else {
		return {
			category: "Hazardous (खतरनाक)",
			advice: "Emergency conditions: entire population is more likely to be affected. Avoid all outdoor activity.",
		};
	}
}

async function fetchWAQIData(lat: number, lon: number) {
	try {
		const token = "demo";
		const res = await fetch(`https://api.waqi.info/feed/geo:${lat};${lon}/?token=${token}`);
		const data = await res.json();
		if (data.status !== "ok" || !data.data) return null;

		const stationName = data.data.city?.name || "";
		// Validate station is in Nepal (WAQI geo finds nearest globally)
		const isNepalStation = /nepal|kathmandu|pokhara|biratnagar|birgunj|dharan|bharatpur|hetauda|butwal|janakpur|nepalgunj|birendranagar|dhangadhi|mahendranagar|tulsipur|gorkha|hetauda|bhaktapur|lalitpur|patan|kirtipur|madhyapur|thimi|suryabinayak|changunarayan|dakshinkali|kageshwari|manohara|nagarjun|shankharapur|tokha|budhanilkantha|chandragiri|dakshinkali|kirtipur|nagarjun|shankharapur|tokha/i.test(stationName);
		
		if (!isNepalStation) {
			console.log(`[WAQI] Skipping non-Nepal station: ${stationName}`);
			return null;
		}

		const iaqi = data.data.iaqi || {};
		const usAqi = data.data.aqi ?? 0;

		return {
			source: "waqi",
			station: stationName,
			us_aqi: usAqi,
			pm2_5: iaqi.pm25?.v,
			pm10: iaqi.pm10?.v,
			no2: iaqi.no2?.v,
			co: iaqi.co?.v,
			o3: iaqi.o3?.v,
			so2: iaqi.so2?.v,
			timestamp: data.data.time?.iso || new Date().toISOString(),
		};
	} catch {
		return null;
	}
}

async function fetchOpenAQData(lat: number, lon: number) {
	try {
		const res = await fetch(
			`https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=25000&limit=1&order_by=lastUpdated&sort=desc`
		);
		const data = await res.json();
		if (!data.results?.length) return null;

		const measurements = data.results[0].measurements || {};
		const getVal = (param: string) => measurements.find((m: any) => m.parameter === param)?.value;

		const usAqi = calculateUSAQI(getVal("pm25"), getVal("pm10"), getVal("o3"), getVal("no2"), getVal("so2"), getVal("co"));

		return {
			source: "openaq",
			station: data.results[0].location,
			us_aqi: usAqi,
			pm2_5: getVal("pm25"),
			pm10: getVal("pm10"),
			no2: getVal("no2"),
			co: getVal("co"),
			o3: getVal("o3"),
			so2: getVal("so2"),
			timestamp: data.results[0].lastUpdated,
		};
	} catch {
		return null;
	}
}

function calculateUSAQI(pm25?: number, pm10?: number, o3?: number, no2?: number, so2?: number, co?: number): number {
	const breakpoints = [
		{ cLow: 0, cHigh: 12.0, iLow: 0, iHigh: 50 },
		{ cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
		{ cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
		{ cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
		{ cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
		{ cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
	];
	const calc = (conc: number, bp: typeof breakpoints) => {
		for (const b of bp) {
			if (conc >= b.cLow && conc <= b.cHigh) {
				return ((b.iHigh - b.iLow) / (b.cHigh - b.cLow)) * (conc - b.cLow) + b.iLow;
			}
		}
		return conc > 500.4 ? 500 : 0;
	};
	const subIndices = [
		pm25 ? calc(pm25, breakpoints) : 0,
		pm10 ? calc(pm10, [{ cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 }, { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 }, { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 }, { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 }, { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 }, { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 }]) : 0,
	].filter(v => v > 0);
	return subIndices.length ? Math.round(Math.max(...subIndices)) : 0;
}

async function fetchOpenMeteoData(lat: number, lon: number) {
	try {
		const [aqiRes, weatherRes] = await Promise.all([
			fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`),
			fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`),
		]);
		if (!aqiRes.ok || !weatherRes.ok) return null;

		const aqiData = await aqiRes.json();
		const weatherData = await weatherRes.json();

		return {
			source: "open-meteo",
			station: "Model grid (11km resolution)",
			us_aqi: aqiData?.current?.us_aqi ?? 0,
			pm2_5: aqiData?.current?.pm2_5 ?? 0,
			pm10: aqiData?.current?.pm10 ?? 0,
			no2: aqiData?.current?.nitrogen_dioxide ?? 0,
			co: aqiData?.current?.carbon_monoxide ?? 0,
			o3: aqiData?.current?.ozone ?? 0,
			so2: aqiData?.current?.sulphur_dioxide ?? 0,
			temperature_celsius: weatherData?.current?.temperature_2m ?? 0,
			relative_humidity_percent: weatherData?.current?.relative_humidity_2m ?? 0,
			wind_speed_kmh: weatherData?.current?.wind_speed_10m ?? 0,
			timestamp: new Date().toISOString(),
		};
	} catch {
		return null;
	}
}

export async function fetchAQIAndWeatherData(location: string) {
	const city = getCityCoords(location);

	// Try sources in priority order: WAQI (real stations) → OpenAQ (govt) → Open-Meteo (model)
	const sources = await Promise.allSettled([
		fetchOpenAQData(city.lat, city.lon),      // Primary: govt stations with radius filtering
		fetchWAQIData(city.lat, city.lon),        // Secondary: WAQI (validated for Nepal)
		fetchOpenMeteoData(city.lat, city.lon),   // Fallback: model data
	]);

	let data: any = null;
	let sourceUsed = "unknown";

	for (const result of sources) {
		if (result.status === "fulfilled" && result.value) {
			data = result.value;
			sourceUsed = result.value.source;
			break;
		}
	}

	if (!data) {
		return {
			location: city.name,
			error: "Unable to retrieve live AQI data from all sources.",
		};
	}

	// Fetch weather if not from Open-Meteo
	let weather = data;
	if (sourceUsed !== "open-meteo") {
		try {
			const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`);
			const w = await weatherRes.json();
			weather = {
				...data,
				temperature_celsius: w?.current?.temperature_2m ?? 0,
				relative_humidity_percent: w?.current?.relative_humidity_2m ?? 0,
				wind_speed_kmh: w?.current?.wind_speed_10m ?? 0,
			};
		} catch {
			weather = { ...data, temperature_celsius: 0, relative_humidity_percent: 0, wind_speed_kmh: 0 };
		}
	}

	const { category, advice } = getAQICategory(weather.us_aqi);

	return {
		location: city.name,
		us_aqi: weather.us_aqi,
		status_category: category,
		health_advice: advice,
		pm2_5_ug_m3: weather.pm2_5 ?? 0,
		pm10_ug_m3: weather.pm10 ?? 0,
		nitrogen_dioxide_ug_m3: weather.no2 ?? 0,
		carbon_monoxide_ug_m3: weather.co ?? 0,
		ozone_ug_m3: weather.o3 ?? 0,
		sulphur_dioxide_ug_m3: weather.so2 ?? 0,
		temperature_celsius: weather.temperature_celsius ?? 0,
		relative_humidity_percent: weather.relative_humidity_percent ?? 0,
		wind_speed_kmh: weather.wind_speed_kmh ?? 0,
		data_source: sourceUsed,
		station: weather.station,
		timestamp: weather.timestamp,
	};
}

export const getLiveAQIAndWeather = tool({
	description: `
Fetches real-time, live Air Quality Index (AQI) and weather data for any city in Nepal.

Call this tool whenever the user asks about:
- Air quality, air pollution, hawa (हावा), hawapani (हावापानी)
- AQI or Air Quality Index
- PM2.5 or PM10 or particulate matter
- Smog, dust, pollution levels
- Current weather: temperature, humidity, wind speed
- Whether the air is safe to breathe or if they should wear a mask
- Any question containing words: "air", "AQI", "pollution", "weather", "mausam (मौसम)", "hawa (हावा)", "taapkram (तापक्रम)"

Data Sources (tried in order):
1. WAQI (World Air Quality Index) - Real monitoring stations, matches IQAir data
2. OpenAQ - Government monitoring stations
3. Open-Meteo - Atmospheric model (fallback)

Returns: us_aqi, status_category, health_advice, pm2_5, pm10, no2, co, o3, so2, temperature_celsius, relative_humidity_percent, wind_speed_kmh, data_source, station, timestamp.
`.trim(),
	parameters: z.object({
		location: z
			.string()
			.describe(
				"The city or location name in Nepal to get live AQI and weather for. " +
				"Examples: 'Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Biratnagar', 'Dharan', 'Butwal', 'Hetauda', 'Nepalgunj', 'Birgunj', 'Janakpur'. " +
				"If the user has not specified a city, use 'Kathmandu' as the default.",
			),
	}),
	execute: async ({ location }) => {
		return await fetchAQIAndWeatherData(location);
	},
});
