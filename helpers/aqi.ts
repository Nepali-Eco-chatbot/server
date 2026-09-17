import { tool } from "ai";
import { z } from "zod";

interface CityCoords {
	name: string;
	lat: number;
	lon: number;
}

const NEPAL_CITIES: Record<string, CityCoords> = {
	// Bagmati Province
	kathmandu: { name: "Kathmandu", lat: 27.7083, lon: 85.3206 },
	lalitpur: { name: "Lalitpur", lat: 27.6767, lon: 85.3168 },
	patan: { name: "Lalitpur (Patan)", lat: 27.6767, lon: 85.3168 },
	bhaktapur: { name: "Bhaktapur", lat: 27.671, lon: 85.4298 },
	hetauda: { name: "Hetauda", lat: 27.4311, lon: 85.0319 },
	birgunj: { name: "Birgunj", lat: 27.0135, lon: 84.8764 },
	barista: { name: "Barista", lat: 27.1167, lon: 84.8667 },
	chitwan: { name: "Chitwan (Bharatpur)", lat: 27.6806, lon: 84.4309 },
	bharatpur: { name: "Bharatpur", lat: 27.6806, lon: 84.4309 },
	narayanghat: { name: "Narayanghat", lat: 27.6955, lon: 84.426 },
	narayangarh: { name: "Narayangarh", lat: 27.6955, lon: 84.426 },
	gaindakot: { name: "Gaindakot", lat: 27.7057, lon: 84.3913 },
	gaidakot: { name: "Gaidakot", lat: 27.7057, lon: 84.3913 },
	dhulikhel: { name: "Dhulikhel", lat: 27.6200, lon: 85.5536 },
	kirtipur: { name: "Kirtipur", lat: 27.6667, lon: 85.2833 },
	sankhu: { name: "Sankhu", lat: 27.7453, lon: 85.4447 },
	tokha: { name: "Tokha", lat: 27.7500, lon: 85.3333 },
	budhanilkantha: { name: "Budhanilkantha", lat: 27.7833, lon: 85.3500 },
	godavari: { name: "Godavari", lat: 27.5833, lon: 85.3333 },
	panauti: { name: "Panauti", lat: 27.5833, lon: 85.5167 },
	dolalghat: { name: "Dolalghat", lat: 27.6333, lon: 85.5333 },
	sindhupalchok: { name: "Sindhupalchok", lat: 27.8000, lon: 85.5833 },
	dhading: { name: "Dhading Besi", lat: 27.8333, lon: 84.9167 },
	kavrepalanchok: { name: "Kavrepalanchok (Dhulikhel)", lat: 27.6200, lon: 85.5536 },
	rasuwa: { name: "Rasuwa (Dhunche)", lat: 28.1167, lon: 85.2833 },
	nuwakot: { name: "Nuwakot (Bidur)", lat: 27.8833, lon: 85.1667 },
	sindhuli: { name: "Sindhuli (Kamalamai)", lat: 27.3000, lon: 85.5500 },
	dolakha: { name: "Dolakha (Bhimeshwar)", lat: 27.6667, lon: 86.1333 },
	ramechhap: { name: "Ramechhap", lat: 27.4167, lon: 86.0833 },
	solukhumbu: { name: "Solukhumbu (Salleri)", lat: 27.5500, lon: 86.5500 },
	okhaldhunga: { name: "Okhaldhunga", lat: 27.3333, lon: 86.5000 },
	makwanpur: { name: "Makwanpur", lat: 27.4311, lon: 85.0319 },
	dhunche: { name: "Dhunche", lat: 28.1167, lon: 85.2833 },
	bidur: { name: "Bidur", lat: 27.8833, lon: 85.1667 },
	kamalamai: { name: "Kamalamai", lat: 27.3000, lon: 85.5500 },
	bhimeshwar: { name: "Bhimeshwar", lat: 27.6667, lon: 86.1333 },
	salleri: { name: "Salleri", lat: 27.5500, lon: 86.5500 },

	// Koshi Province
	biratnagar: { name: "Biratnagar", lat: 26.4623, lon: 87.2816 },
	dharan: { name: "Dharan", lat: 26.8126, lon: 87.2838 },
	itahari: { name: "Itahari", lat: 26.6626, lon: 87.2747 },
	damak: { name: "Damak", lat: 26.6597, lon: 87.6978 },
	birtamod: { name: "Birtamod", lat: 26.6333, lon: 87.9333 },
	illam: { name: "Illam", lat: 26.9167, lon: 87.9333 },
	dhankuta: { name: "Dhankuta", lat: 27.0167, lon: 87.3333 },
	bhojpur: { name: "Bhojpur", lat: 27.1667, lon: 87.0500 },
	khotang: { name: "Khotang (Diktel)", lat: 27.2167, lon: 86.8833 },
	udayapur: { name: "Udayapur (Triyuga)", lat: 26.9333, lon: 86.7333 },
	sunsari: { name: "Sunsari (Inaruwa)", lat: 26.6333, lon: 87.1833 },
	terhathum: { name: "Terhathum (Myanglung)", lat: 27.1833, lon: 87.5500 },
	panchthar: { name: "Panchthar (Phidim)", lat: 27.1500, lon: 87.8333 },
	taplejung: { name: "Taplejung", lat: 27.3500, lon: 87.6667 },
	sankhuwasabha: { name: "Sankhuwasabha", lat: 27.3667, lon: 87.2167 },
	inaruwa: { name: "Inaruwa", lat: 26.6333, lon: 87.1833 },
	diktel: { name: "Diktel", lat: 27.2167, lon: 86.8833 },
	myanglung: { name: "Myanglung", lat: 27.1833, lon: 87.5500 },
	phidim: { name: "Phidim", lat: 27.1500, lon: 87.8333 },
	triyuga: { name: "Triyuga", lat: 26.9333, lon: 86.7333 },

	// Madhesh Province
	janakpur: { name: "Janakpur", lat: 26.7285, lon: 85.9249 },
	jaleshwar: { name: "Jaleshwar", lat: 26.6500, lon: 85.7833 },
	rajbiraj: { name: "Rajbiraj", lat: 26.5333, lon: 86.7500 },
	siraha: { name: "Siraha", lat: 26.6500, lon: 86.2000 },
	kalaiya: { name: "Kalaiya", lat: 27.1333, lon: 85.0000 },
	tripureshwor: { name: "Tripureshwor", lat: 27.1500, lon: 85.0167 },
	baratipur: { name: "Baratpur", lat: 27.1167, lon: 84.8667 },
	siddharthanagar: { name: "Siddharthanagar (Bhairahawa)", lat: 27.5000, lon: 83.4500 },

	// Lumbini Province
	pokhara: { name: "Pokhara", lat: 28.2096, lon: 83.9856 },
	butwal: { name: "Butwal", lat: 27.7000, lon: 83.4484 },
	bhairahawa: { name: "Bhairahawa", lat: 27.5000, lon: 83.4500 },
	tulsipur: { name: "Tulsipur", lat: 28.1329, lon: 82.2989 },
	ghorahi: { name: "Ghorahi", lat: 28.0333, lon: 82.5000 },
	damauli: { name: "Damauli", lat: 27.9833, lon: 84.1667 },
	besisahar: { name: "Besisahar", lat: 28.2333, lon: 84.3833 },
	gorkha: { name: "Gorkha", lat: 28.0000, lon: 84.6333 },
	kusma: { name: "Kusma", lat: 28.2227, lon: 83.6826 },
	beni: { name: "Beni", lat: 28.3333, lon: 83.5667 },
	jomsom: { name: "Jomsom", lat: 28.7833, lon: 83.7333 },
	taulihawa: { name: "Taulihawa", lat: 27.5500, lon: 83.0500 },
	lamahi: { name: "Lamahi", lat: 27.9000, lon: 82.9000 },
	lamjung: { name: "Lamjung", lat: 28.2333, lon: 84.3833 },
	syangja: { name: "Syangja", lat: 27.9833, lon: 83.6667 },
	parbat: { name: "Parbat", lat: 28.2227, lon: 83.6826 },
	myagdi: { name: "Myagdi", lat: 28.3333, lon: 83.5667 },
	tanahun: { name: "Tanahun", lat: 27.9833, lon: 84.1667 },

	// Karnali Province
	surkhet: { name: "Surkhet", lat: 28.6000, lon: 81.6333 },
	birendranagar: { name: "Birendranagar", lat: 28.6000, lon: 81.6333 },
	dailekh: { name: "Dailekh", lat: 28.8333, lon: 81.7000 },
	jajarkot: { name: "Jajarkot", lat: 28.7000, lon: 82.1833 },
	dolpa: { name: "Dolpa (Dunai)", lat: 28.9833, lon: 82.8667 },
	mugu: { name: "Mugu (Gamgadhi)", lat: 29.3167, lon: 82.0833 },
	jumla: { name: "Jumla", lat: 29.2747, lon: 82.1933 },
	humla: { name: "Humla (Simikot)", lat: 29.9667, lon: 81.8333 },
	simikot: { name: "Simikot", lat: 29.9667, lon: 81.8333 },
	salyan: { name: "Salyan", lat: 28.4833, lon: 82.1667 },
	rolpa: { name: "Rolpa", lat: 28.3833, lon: 82.6333 },
	rukum: { name: "Rukum", lat: 28.5333, lon: 82.4333 },
	dunai: { name: "Dunai", lat: 28.9833, lon: 82.8667 },
	gamgadhi: { name: "Gamgadhi", lat: 29.3167, lon: 82.0833 },

	// Sudurpashchim Province
	dhangadhi: { name: "Dhangadhi", lat: 28.6833, lon: 80.6000 },
	mahendranagar: { name: "Mahendranagar", lat: 28.9723, lon: 80.1846 },
	bhimdatta: { name: "Bhimdatta", lat: 28.9723, lon: 80.1846 },
	attariya: { name: "Attariya", lat: 28.8333, lon: 80.9333 },
	dasharathchand: { name: "Dasharathchand", lat: 29.3167, lon: 80.5833 },
	darchula: { name: "Darchula", lat: 29.8300, lon: 80.5500 },
	dipayal: { name: "Dipayal", lat: 29.1333, lon: 80.9500 },
	mangalsen: { name: "Mangalsen", lat: 29.0833, lon: 81.2667 },
	jayaprithvi: { name: "Jayaprithvi", lat: 29.5333, lon: 81.0833 },
	martadi: { name: "Martadi", lat: 29.5000, lon: 81.0667 },
	sanphebagar: { name: "Sanphebagar", lat: 29.1833, lon: 81.3500 },
	khaptad: { name: "Khaptad", lat: 29.3833, lon: 81.1167 },
	tikapur: { name: "Tikapur", lat: 28.5000, lon: 81.1333 },
	// Province 1 additional
	mechinagar: { name: "Mechinagar", lat: 26.4333, lon: 87.9333 },
};

function getCityCoords(locationQuery: string): CityCoords | null {
	const normalized = locationQuery.toLowerCase().trim();
	for (const key of Object.keys(NEPAL_CITIES)) {
		if (normalized.includes(key)) {
			return NEPAL_CITIES[key];
		}
	}
	return null;
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

export async function fetchAQIAndWeatherData(location: string) {
	const city = getCityCoords(location);
	if (!city) {
		return {
			location: location,
			error: `No data available for "${location}". Supported cities are limited to the mapped cities in Nepal.`,
			supported: true,
		};
	}
	try {
		const [aqiRes, weatherRes] = await Promise.all([
			fetch(
				`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`,
			),
			fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`,
			),
		]);

		if (!aqiRes.ok || !weatherRes.ok) {
			throw new Error("Failed to fetch live environmental data from API");
		}

		const aqiData = await aqiRes.json();
		const weatherData = await weatherRes.json();

		const currentAqi = aqiData?.current?.us_aqi ?? 0;
		const pm2_5 = aqiData?.current?.pm2_5 ?? 0;
		const pm10 = aqiData?.current?.pm10 ?? 0;
		const no2 = aqiData?.current?.nitrogen_dioxide ?? 0;
		const co = aqiData?.current?.carbon_monoxide ?? 0;

		const temp = weatherData?.current?.temperature_2m ?? 0;
		const humidity = weatherData?.current?.relative_humidity_2m ?? 0;
		const windSpeed = weatherData?.current?.wind_speed_10m ?? 0;

		const { category, advice } = getAQICategory(currentAqi);

		return {
			location: city.name,
			us_aqi: currentAqi,
			status_category: category,
			health_advice: advice,
			pm2_5_ug_m3: pm2_5,
			pm10_ug_m3: pm10,
			nitrogen_dioxide_ug_m3: no2,
			carbon_monoxide_ug_m3: co,
			temperature_celsius: temp,
			relative_humidity_percent: humidity,
			wind_speed_kmh: windSpeed,
		};
	} catch (error) {
		console.error("Error fetching AQI data:", error);
		return {
			location: city.name,
			error: "Unable to retrieve live AQI data at this moment.",
		};
	}
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

Returns: us_aqi, status_category, health_advice, pm2_5, pm10, temperature_celsius, relative_humidity_percent, wind_speed_kmh.
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
