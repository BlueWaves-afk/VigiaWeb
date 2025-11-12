"use client";

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

type HazardType = "pothole" | "debris" | "flood";

type Props = {
	cityBounds?: Bounds;
	cellSize?: number;
	horizonHours?: number;
	seed?: number;
};

type HazardRecord = {
	ts: number;
	lat: number;
	lon: number;
	type: HazardType;
	severity: 1 | 2 | 3 | 4 | 5;
	rain_mm: number;
	temp_c: number;
};

type Bounds = {
	latMin: number;
	latMax: number;
	lonMin: number;
	lonMax: number;
};

type ForecastCell = {
	row: number;
	col: number;
	hour: number;
	prob: number;
	typeDist: Record<HazardType, number>;
	avgSeverity: number;
};

type CellFeature = {
	row: number;
	col: number;
	countsPerHour: number[];
	typeCounts: Record<HazardType, number[]>;
	rainPerHour: number[];
	severityPerHour: number[];
	totalCount: number;
	totalSeverity: number;
	density: number;
};

type GridFeatures = {
	rows: number;
	cols: number;
	cellSizeM: number;
	latStep: number;
	lonStep: number;
	startTs: number;
	hours: number;
	perCell: Record<string, CellFeature>;
	totalCountsPerHour: number[];
	hourTimestamps: number[];
	maxDensity: number;
};

type ForecastResult = {
	grid: ForecastCell[];
	rows: number;
	cols: number;
	cellSizeM: number;
	generatedAt: number;
	latencyMs: number;
	topHotspots: ForecastCell[];
	hourSteps: number;
	confidenceByCell: Record<string, number>;
};

type LogEntry = {
	id: string;
	ts: number;
	message: string;
};

type HazardFilter = HazardType | "all";

const DEFAULT_BOUNDS: Bounds = {
	latMin: 25.0,
	latMax: 25.45,
	lonMin: 55.15,
	lonMax: 55.55,
};

const HAZARD_TYPES: HazardType[] = ["pothole", "debris", "flood"];

const UNIT_COST: Record<HazardType, number> = {
	pothole: 480,
	debris: 320,
	flood: 620,
};

const COLOR_STOPS: Array<{ stop: number; r: number; g: number; b: number; a: number }> = [
	{ stop: 0, r: 0, g: 180, b: 0, a: 0.15 },
	{ stop: 0.5, r: 255, g: 200, b: 0, a: 0.35 },
	{ stop: 1, r: 220, g: 0, b: 0, a: 0.55 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function seededRng(seed: number) {
	let s = seed % 2147483647;
	if (s <= 0) s += 2147483646;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

function latLonToXY(
	lat: number,
	lon: number,
	bounds: Bounds,
	width: number,
	height: number
) {
	const x = ((lon - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * width;
	const y = height - ((lat - bounds.latMin) / (bounds.latMax - bounds.latMin)) * height;
	return { x, y };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function generateHistorical(seed: number, bounds: Bounds, days = 30): HazardRecord[] {
	const rng = seededRng(seed);
	const count = 10000 + Math.floor(rng() * 8000);
	const clusters = Array.from({ length: 6 }, () => ({
		lat:
			bounds.latMin + (bounds.latMax - bounds.latMin) * (0.2 + 0.6 * rng()),
		lon:
			bounds.lonMin + (bounds.lonMax - bounds.lonMin) * (0.2 + 0.6 * rng()),
		spreadKm: 0.6 + rng() * 1.4,
	}));
	const now = Date.now();
	const startTs = now - days * 24 * 60 * 60 * 1000;
	const records: HazardRecord[] = [];
	for (let i = 0; i < count; i += 1) {
		const cluster = clusters[Math.floor(rng() * clusters.length)];
		const angle = rng() * Math.PI * 2;
		const radius = Math.sqrt(rng()) * cluster.spreadKm;
		const latOffset = (radius * Math.cos(angle)) / 111;
		const lonOffset = (radius * Math.sin(angle)) /
			(111 * Math.cos(((bounds.latMin + bounds.latMax) / 2) * (Math.PI / 180)));
		let lat = cluster.lat + latOffset;
		let lon = cluster.lon + lonOffset;
		lat = Math.min(bounds.latMax, Math.max(bounds.latMin, lat));
		lon = Math.min(bounds.lonMax, Math.max(bounds.lonMin, lon));

		const ts = startTs + rng() * (now - startTs);
		const date = new Date(ts);
		const hour = date.getHours();
		const commuteBoost = Math.exp(-Math.pow((hour - 8) / 3, 2)) + Math.exp(-Math.pow((hour - 18) / 3, 2));
		const weekend = date.getDay() === 0 || date.getDay() === 6;
		const rain_mm = rng() * (weekend ? 2 : 6) * (1 + commuteBoost * 0.3);
		const temp_c = 28 + rng() * 12 - rain_mm * 0.4;

			const typeRoll = rng();
			let hazard: HazardType = typeRoll < 0.5 ? "pothole" : typeRoll < 0.8 ? "debris" : "flood";
			if (rain_mm > 6) {
				const rainBias = rng();
				hazard = rainBias > 0.65 ? "flood" : rainBias > 0.3 ? "pothole" : hazard;
			}
		const severity = (1 + Math.min(4, Math.floor(rng() * 5))) as HazardRecord["severity"];
		const rainFactor = rain_mm > 4 ? 1.4 : 1;
		const commuterFactor = 0.5 + commuteBoost * 0.6;
		if ((rng() * 2 > commuterFactor * rainFactor) && rng() > 0.6) continue;

		const record: HazardRecord = {
			ts,
			lat,
			lon,
				type: hazard,
			severity,
			rain_mm,
			temp_c,
		};
		records.push(record);
	}
	return records;
}

function bucketToGrid(records: HazardRecord[], bounds: Bounds, cellSizeM: number): GridFeatures {
	const midLat = (bounds.latMax + bounds.latMin) / 2;
	const latStep = cellSizeM / 111000;
	const lonStep = cellSizeM / (111000 * Math.cos((midLat * Math.PI) / 180));
	const rows = Math.max(1, Math.ceil((bounds.latMax - bounds.latMin) / latStep));
	const cols = Math.max(1, Math.ceil((bounds.lonMax - bounds.lonMin) / lonStep));
	const sorted = [...records].sort((a, b) => a.ts - b.ts);
	const startTs = sorted.length ? sorted[0].ts : Date.now();
	const endTs = sorted.length ? sorted[sorted.length - 1].ts : Date.now();
	const hours = Math.max(1, Math.ceil((endTs - startTs) / (60 * 60 * 1000)));
	const hourTimestamps = Array.from({ length: hours }, (_, idx) => startTs + idx * 60 * 60 * 1000);
	const perCell: Record<string, CellFeature> = {};
	const totalCountsPerHour = Array(hours).fill(0);

	const ensureCell = (row: number, col: number) => {
		const key = `${row}:${col}`;
		if (!perCell[key]) {
			perCell[key] = {
				row,
				col,
				countsPerHour: Array(hours).fill(0),
				typeCounts: {
					pothole: Array(hours).fill(0),
					debris: Array(hours).fill(0),
					flood: Array(hours).fill(0),
				},
				rainPerHour: Array(hours).fill(0),
				severityPerHour: Array(hours).fill(0),
				totalCount: 0,
				totalSeverity: 0,
				density: 0,
			};
		}
		return perCell[key];
	};

	for (const record of records) {
		const row = Math.min(rows - 1, Math.max(0, Math.floor((record.lat - bounds.latMin) / latStep)));
		const col = Math.min(cols - 1, Math.max(0, Math.floor((record.lon - bounds.lonMin) / lonStep)));
		const hourIdx = Math.min(hours - 1, Math.max(0, Math.floor((record.ts - startTs) / (60 * 60 * 1000))));
		const cell = ensureCell(row, col);
		cell.countsPerHour[hourIdx] += 1;
		cell.typeCounts[record.type][hourIdx] += 1;
		cell.rainPerHour[hourIdx] += record.rain_mm;
		cell.severityPerHour[hourIdx] += record.severity;
		cell.totalCount += 1;
		cell.totalSeverity += record.severity;
		totalCountsPerHour[hourIdx] += 1;
	}

	let maxDensity = 0;
	for (const cell of Object.values(perCell)) {
		cell.density = cell.totalCount / hours;
		maxDensity = Math.max(maxDensity, cell.density);
	}

	return {
		rows,
		cols,
		cellSizeM,
		latStep,
		lonStep,
		startTs,
		hours,
		perCell,
		totalCountsPerHour,
		hourTimestamps,
		maxDensity: maxDensity || 1,
	};
}

function kdeTemporalEMA(feature: CellFeature, hazard: HazardFilter) {
	const counts = hazard === "all" ? feature.countsPerHour : feature.typeCounts[hazard];
	const recentWindow = counts.slice(-6);
	const dayWindow = counts.slice(-24);
	let ema = 0;
	const alpha = 0.45;
	for (let i = Math.max(0, counts.length - 48); i < counts.length; i += 1) {
		ema = alpha * counts[i] + (1 - alpha) * ema;
	}
	const recent = recentWindow.reduce((sum, v) => sum + v, 0);
	const dayAvg = dayWindow.reduce((sum, v) => sum + v, 0) / Math.max(1, dayWindow.length);
	const rain = feature.rainPerHour.slice(-12).reduce((sum, v) => sum + v, 0);
	const severityAvg = feature.totalSeverity / Math.max(1, feature.totalCount);
	const weatherFactor = hazard === "flood" ? rain * 0.012 : hazard === "pothole" ? rain * 0.008 : rain * 0.005;
	const baseScore = ema * 0.35 + recent * 0.45 + dayAvg * 0.2 + feature.density * 0.5 + severityAvg * 0.18 + weatherFactor;
	const probability = 1 - Math.exp(-baseScore * 0.6);
	return clamp01(probability + 0.03 * Math.random());
}

async function simulateCloudForecast({
	hazard,
	horizonHours,
	nowTs,
	features,
	seed,
}: {
	hazard: HazardFilter;
	horizonHours: number;
	nowTs: number;
	features: GridFeatures;
	seed: number;
}): Promise<ForecastResult> {
	const rng = seededRng(seed + Math.floor(nowTs / 1000));
	const latencyMs = 300 + Math.floor(rng() * 900);
	await new Promise((resolve) => setTimeout(resolve, latencyMs));
	const grid: ForecastCell[] = [];
	const confidenceByCell: Record<string, number> = {};
	const nowDate = new Date(nowTs);
	const currentHour = nowDate.getUTCHours();
	const hazardSet = hazard === "all" ? HAZARD_TYPES : [hazard];

	for (const [key, cell] of Object.entries(features.perCell)) {
		const base = kdeTemporalEMA(cell, hazard);
		const confidence = clamp01(0.25 + (cell.density / (features.maxDensity || 1)) * 0.7);
		confidenceByCell[key] = confidence;
		const typeTotals: Record<HazardType, number> = {
			pothole: cell.typeCounts.pothole.reduce((sum, v) => sum + v, 0),
			debris: cell.typeCounts.debris.reduce((sum, v) => sum + v, 0),
			flood: cell.typeCounts.flood.reduce((sum, v) => sum + v, 0),
		};
		const typeTotal = Object.values(typeTotals).reduce((sum, v) => sum + v, 0) || 1;
		const typeDist: Record<HazardType, number> = {
			pothole: typeTotals.pothole / typeTotal,
			debris: typeTotals.debris / typeTotal,
			flood: typeTotals.flood / typeTotal,
		};
		const avgSeverity = cell.totalSeverity / Math.max(1, cell.totalCount);
		for (let hour = 0; hour < horizonHours; hour += 1) {
			const hourOfDay = (currentHour + hour) % 24;
			const commuteBoost = Math.exp(-Math.pow((hourOfDay - 8) / 3, 2)) + Math.exp(-Math.pow((hourOfDay - 18) / 3, 2));
			const temporalDrift = Math.sin((features.hours + hour) / 6) * 0.08;
			const hazardBoost = hazardSet.length > 1 ? 1 : hazardSet[0] === "flood" ? 1.12 : hazardSet[0] === "pothole" ? 1.05 : 1.02;
			const noise = (rng() - 0.5) * 0.12;
			let prob = base * hazardBoost;
			prob += base * 0.35 * commuteBoost;
			prob += temporalDrift;
			prob += noise;
			prob = clamp01(prob * (0.7 + confidence * 0.6));
			const filteredDist: Record<HazardType, number> = {
				pothole: hazard === "all" || hazard === "pothole" ? typeDist.pothole : 0,
				debris: hazard === "all" || hazard === "debris" ? typeDist.debris : 0,
				flood: hazard === "all" || hazard === "flood" ? typeDist.flood : 0,
			};
			const distSum = Object.values(filteredDist).reduce((sum, v) => sum + v, 0) || 1;
			const normalizedDist: Record<HazardType, number> = {
				pothole: filteredDist.pothole / distSum,
				debris: filteredDist.debris / distSum,
				flood: filteredDist.flood / distSum,
			};
			grid.push({
				row: cell.row,
				col: cell.col,
				hour,
				prob,
				typeDist: normalizedDist,
				avgSeverity,
			});
		}
	}

	const topHotspots = [...grid]
		.sort((a, b) => b.prob - a.prob)
		.slice(0, 60);

	return {
		grid,
		rows: features.rows,
		cols: features.cols,
		cellSizeM: features.cellSizeM,
		generatedAt: nowTs,
		latencyMs,
		topHotspots,
		hourSteps: horizonHours,
		confidenceByCell,
	};
}

function estimateMaintenanceCost(
	forecast: ForecastResult,
	hazard: HazardFilter,
	cellAreaKm2: number
) {
	const hours = Math.min(24, forecast.hourSteps);
	let cost = 0;
	for (const cell of forecast.grid) {
		if (cell.hour >= hours) continue;
		const hazardMix = hazard === "all" ? HAZARD_TYPES : [hazard];
		for (const h of hazardMix) {
			const expected = cell.prob * (cell.typeDist[h] || 0);
			cost += expected * UNIT_COST[h] * cellAreaKm2;
		}
	}
	return cost;
}

function exportForecastJSON(forecast: ForecastResult) {
	const blob = new Blob([JSON.stringify(forecast, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `forecast-${new Date(forecast.generatedAt).toISOString()}.json`;
	link.click();
	URL.revokeObjectURL(url);
}

function exportForecastCSV(forecast: ForecastResult) {
	const header = "row,col,hour,prob,pothole_prob,debris_prob,flood_prob,avg_severity";
	const lines = forecast.grid.map((cell) =>
		[
			cell.row,
			cell.col,
			cell.hour,
			cell.prob.toFixed(4),
			(cell.typeDist.pothole || 0).toFixed(4),
			(cell.typeDist.debris || 0).toFixed(4),
			(cell.typeDist.flood || 0).toFixed(4),
			cell.avgSeverity.toFixed(2),
		].join(",")
	);
	const blob = new Blob([`${header}\n${lines.join("\n")}`], {
		type: "text/csv",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `forecast-${new Date(forecast.generatedAt).toISOString()}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}

function heatColor(prob: number, confidence: number) {
	const clamped = clamp01(prob);
	const [low, mid, high] = COLOR_STOPS;
	let from = low;
	let to = high;
	let t = 0;
	if (clamped <= mid.stop) {
		from = low;
		to = mid;
		t = clamped / mid.stop;
	} else {
		from = mid;
		to = high;
		t = (clamped - mid.stop) / (high.stop - mid.stop || 1);
	}
	const lerp = (a: number, b: number) => a + (b - a) * t;
	const alpha = lerp(from.a, to.a) * (0.5 + confidence * 0.5);
	const r = Math.round(lerp(from.r, to.r));
	const g = Math.round(lerp(from.g, to.g));
	const b = Math.round(lerp(from.b, to.b));
	return `rgba(${r},${g},${b},${alpha})`;
}

function formatNumber(value: number) {
	return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatCurrency(value: number) {
	return value.toLocaleString(undefined, {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});
}

function formatPercent(value: number) {
	return `${Math.round(value * 100)}%`;
}

function formatTime(ts: number) {
	return new Date(ts).toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

function buildSparkline(data: number[], width: number, height: number) {
	if (!data.length) return "";
	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = max - min || 1;
	return data
		.map((value, idx) => {
			const x = (idx / (data.length - 1 || 1)) * width;
			const y = height - ((value - min) / range) * height;
			return `${idx === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
		})
		.join(" ");
}

const ForecastDemo: React.FC<Props> = ({
	cityBounds,
	cellSize = 250,
	horizonHours = 24,
	seed = Math.floor(Math.random() * 1_000_000),
}) => {
	const bounds = cityBounds ?? DEFAULT_BOUNDS;
	const [hazardFilter, setHazardFilter] = useState<HazardFilter>("all");
	const [horizon, setHorizon] = useState(horizonHours);
	const [rngSeed, setRngSeed] = useState(seed);
	const initialSeedRef = useRef(seed);
	const [history, setHistory] = useState<HazardRecord[]>([]);
	const [features, setFeatures] = useState<GridFeatures | null>(null);
	const [forecast, setForecast] = useState<ForecastResult | null>(null);
	const [busy, setBusy] = useState(false);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [timelineHour, setTimelineHour] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [hovered, setHovered] = useState<{ x: number; y: number; cell: ForecastCell } | null>(null);
	const [showCarousel, setShowCarousel] = useState(true);
	const [carouselIndex, setCarouselIndex] = useState(0);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rafRef = useRef<number | null>(null);

	const appendLog = useCallback((message: string) => {
		setLogs((prev) => [
			{
				id: crypto.randomUUID(),
				ts: Date.now(),
				message,
			},
			...prev,
		].slice(0, 200));
	}, []);

	useEffect(() => {
		const records = generateHistorical(rngSeed, bounds);
		setHistory(records);
		appendLog(`Generated ${formatNumber(records.length)} historical hazard points (seed ${rngSeed}).`);
	}, [rngSeed, bounds.latMax, bounds.latMin, bounds.lonMax, bounds.lonMin, appendLog]);

	useEffect(() => {
		if (!history.length) {
			setFeatures(null);
			return;
		}
		const grid = bucketToGrid(history, bounds, cellSize);
		setFeatures(grid);
	}, [history, bounds, cellSize]);

	const runForecast = useCallback(async () => {
		if (!features) return;
		setBusy(true);
		const started = Date.now();
		appendLog(
			`Simulating cloud forecast… hazard=${hazardFilter}, horizon=${horizon}h, seed=${rngSeed}.`
		);
		try {
			const result = await simulateCloudForecast({
				hazard: hazardFilter,
				horizonHours: horizon,
				nowTs: Date.now(),
				features,
				seed: rngSeed,
			});
			setForecast(result);
			setTimelineHour(0);
			appendLog(
				`Cloud forecast complete in ${result.latencyMs} ms (elapsed ${Date.now() - started} ms).`
			);
		} finally {
			setBusy(false);
		}
	}, [features, hazardFilter, horizon, rngSeed, appendLog]);

	useEffect(() => {
		if (features) {
			runForecast();
		}
	}, [features, runForecast]);

	useEffect(() => {
		if (!features) return;
		runForecast();
	}, [hazardFilter, horizon, features, runForecast]);

	useEffect(() => {
		if (playing) {
			appendLog("Timeline playback started.");
		}
	}, [playing, appendLog]);

	useEffect(() => {
		if (!playing) {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			return;
		}
		let last = performance.now();
		const stepMs = 950;
		const loop = (now: number) => {
			if (now - last >= stepMs) {
				setTimelineHour((prev) => (prev + 1) % Math.max(1, horizon));
				last = now;
			}
			rafRef.current = requestAnimationFrame(loop);
		};
		rafRef.current = requestAnimationFrame(loop);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		};
	}, [playing, horizon]);

	const hotspotsByHour = useMemo(() => {
		if (!forecast) return new Map<number, ForecastCell[]>();
		const map = new Map<number, ForecastCell[]>();
		for (const cell of forecast.grid) {
			if (!map.has(cell.hour)) map.set(cell.hour, []);
			map.get(cell.hour)!.push(cell);
		}
		for (const [hour, cells] of map.entries()) {
			cells.sort((a, b) => b.prob - a.prob);
			map.set(hour, cells.slice(0, 25));
		}
		return map;
	}, [forecast]);

	const historicalRecent = useMemo(() => {
		if (!features) return [] as number[];
		return features.totalCountsPerHour.slice(-Math.min(24, features.totalCountsPerHour.length));
	}, [features]);

	const forecastCounts = useMemo(() => {
		if (!forecast) return [] as number[];
		const counts = Array(forecast.hourSteps).fill(0);
		for (const cell of forecast.grid) {
			counts[cell.hour] += cell.prob;
		}
		return counts;
	}, [forecast]);

	const cityRiskIndex = useMemo(() => {
		if (!forecast) return 0;
		const subset = forecast.grid.filter((cell) => cell.hour < Math.min(6, forecast.hourSteps));
		if (!subset.length) return 0;
		const avg = subset.reduce((sum, cell) => sum + cell.prob, 0) / subset.length;
		return clamp01(avg);
	}, [forecast]);

	const forecastConfidence = useMemo(() => {
		if (!forecast) return 0;
		const values = Object.values(forecast.confidenceByCell);
		if (!values.length) return 0;
		return clamp01(values.reduce((sum, v) => sum + v, 0) / values.length);
	}, [forecast]);

	const maintenanceCost = useMemo(() => {
		if (!forecast) return 0;
		const cellArea = Math.pow(forecast.cellSizeM / 1000, 2);
		return estimateMaintenanceCost(forecast, hazardFilter, cellArea);
	}, [forecast, hazardFilter]);

		const carouselSlides = useMemo(
			() => [
				{
					title: "1. Synthetic history seed",
					body: `We generate ${formatNumber(history.length || 0)} labeled hazard events across ${cellSize} m cells using a seeded RNG so runs stay reproducible, injecting commute spikes, clustered hotspots, and rain-driven pothole/flood surges inside the selected city bounds.`,
				},
				{
					title: "2. Feature cube assembly",
					body: "The raw points are bucketed into a spatio-temporal cube (rows × cols × hours). For each cell we track hourly counts, hazard-type splits, rain accumulation, severity, and a density score that drives confidence levels.",
				},
				{
					title: "3. Simulated cloud inference",
					body: `A faux cloud call waits 300–1200 ms, then applies a temporal EMA + KDE blend with stochastic noise and hazard-specific boosts to predict ${horizon}-hour probabilities. Confidence blends density and recency to mimic model certainty.`,
				},
				{
					title: "4. Visual analytics",
					body: "The forecast powers the canvas heatmap, top hotspot pins, KPI cards, and sparkline comparison. Controls let you explore hazard filters, change horizon, replay the timeline, or export the active grid as JSON/CSV.",
				},
			],
			[history.length, cellSize, horizon]
		);

		const activeSlide = carouselSlides[carouselIndex] ?? carouselSlides[0];

		useEffect(() => {
			if (carouselSlides.length && carouselIndex >= carouselSlides.length) {
				setCarouselIndex(0);
			}
		}, [carouselSlides.length, carouselIndex]);

	const drawScene = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || !forecast) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const parent = canvas.parentElement;
		if (!parent) return;
		const dpr = window.devicePixelRatio || 1;
		const width = parent.clientWidth;
		const height = parent.clientHeight;
		if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;
		}
		ctx.resetTransform();
		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, width, height);
		ctx.fillStyle = "#0f172a";
		ctx.fillRect(0, 0, width, height);
		const cellWidth = width / forecast.cols;
		const cellHeight = height / forecast.rows;

		ctx.strokeStyle = "rgba(255,255,255,0.06)";
		ctx.lineWidth = 1;
		const gridStepRow = Math.max(1, Math.floor(forecast.rows / 8));
		const gridStepCol = Math.max(1, Math.floor(forecast.cols / 8));
		for (let r = 0; r <= forecast.rows; r += gridStepRow) {
			ctx.beginPath();
			ctx.moveTo(0, r * cellHeight);
			ctx.lineTo(width, r * cellHeight);
			ctx.stroke();
		}
		for (let c = 0; c <= forecast.cols; c += gridStepCol) {
			ctx.beginPath();
			ctx.moveTo(c * cellWidth, 0);
			ctx.lineTo(c * cellWidth, height);
			ctx.stroke();
		}

		const currentCells = forecast.grid.filter((cell) => cell.hour === timelineHour);
		for (const cell of currentCells) {
			const key = `${cell.row}:${cell.col}`;
			const confidence = forecast.confidenceByCell[key] ?? 0.6;
			ctx.fillStyle = heatColor(cell.prob, confidence);
			ctx.fillRect(cell.col * cellWidth, cell.row * cellHeight, cellWidth, cellHeight);
		}

		const hotspots = hotspotsByHour.get(timelineHour) ?? [];
		ctx.lineWidth = 2;
		for (const hotspot of hotspots) {
			const x = hotspot.col * cellWidth + cellWidth / 2;
			const y = hotspot.row * cellHeight + cellHeight / 2;
			ctx.beginPath();
			ctx.strokeStyle = "rgba(255,255,255,0.9)";
			ctx.fillStyle = "rgba(15,23,42,0.9)";
			ctx.arc(x, y, Math.max(4, Math.min(cellWidth, cellHeight) * 0.18), 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = "rgba(255,99,71,0.85)";
			ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
		}

		ctx.fillStyle = "rgba(255,255,255,0.4)";
		ctx.fillRect(24, height - 38, 120, 16);
		ctx.fillStyle = "rgba(0,0,0,0.6)";
		ctx.fillRect(28, height - 34, 80, 8);
		ctx.fillStyle = "rgba(255,255,255,0.85)";
		ctx.fillRect(28, height - 34, 60, 8);
		ctx.font = "10px 'Inter', sans-serif";
		ctx.fillText("~3 km", 112, height - 26);
	}, [forecast, hotspotsByHour, timelineHour]);

	useEffect(() => {
		drawScene();
	}, [drawScene]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(() => drawScene());
		observer.observe(parent);
		return () => observer.disconnect();
	}, [drawScene]);

	const handlePointerMove = useCallback(
		(event: React.PointerEvent<HTMLCanvasElement>) => {
			if (!forecast) return;
			const rect = event.currentTarget.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			const col = Math.floor((x / rect.width) * forecast.cols);
			const row = Math.floor((y / rect.height) * forecast.rows);
			const cell = forecast.grid.find(
				(item) => item.hour === timelineHour && item.row === row && item.col === col
			);
			if (!cell || cell.prob < 0.05) {
				setHovered(null);
				return;
			}
			setHovered({ x, y, cell });
		},
		[forecast, timelineHour]
	);

	const handlePointerLeave = useCallback(() => setHovered(null), []);

	return (
		<div className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-xl">
				<AnimatePresence>
					{showCarousel && activeSlide && (
						<motion.div
							key={activeSlide.title}
							initial={{ opacity: 0, y: -24 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -16 }}
							transition={{ type: "spring", stiffness: 210, damping: 22 }}
							className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 p-6 shadow-2xl"
						>
							<button
								onClick={() => setShowCarousel(false)}
								className="absolute right-4 top-4 rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
							>
								Close
							</button>
							<div className="pr-16">
								<motion.h3
									key={`${activeSlide.title}-title`}
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.05 }}
									className="text-lg font-semibold text-emerald-300"
								>
									{activeSlide.title}
								</motion.h3>
								<motion.p
									key={`${activeSlide.title}-body`}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.12 }}
									className="mt-2 text-sm leading-relaxed text-slate-200"
								>
									{activeSlide.body}
								</motion.p>
							</div>
							<div className="mt-5 flex items-center justify-between text-xs text-slate-300">
								<div className="flex items-center gap-2">
									<button
										onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
										className="rounded-lg border border-white/15 px-3 py-1 transition hover:bg-white/10"
									>
										Prev
									</button>
									<button
										onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselSlides.length)}
										className="rounded-lg border border-white/15 px-3 py-1 transition hover:bg-white/10"
									>
										Next
									</button>
								</div>
								<div className="w-32">
									<div className="text-right text-[11px] text-slate-400">
										{carouselIndex + 1} / {carouselSlides.length}
									</div>
									<div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${((carouselIndex + 1) / carouselSlides.length) * 100}%` }}
											transition={{ type: "spring", stiffness: 140, damping: 20 }}
											className="h-full bg-emerald-400"
										/>
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold">Predictive Hazard Forecast (Simulated Cloud)</h2>
					<p className="text-sm text-slate-300">
						Synthetic cloud inference over historical hazards with probabilistic forecasting.
					</p>
				</div>
				<span className={`rounded-full px-4 py-1 text-sm ${busy ? "bg-amber-500/80" : "bg-emerald-500/70"}`}>
					{busy
						? "Simulating cloud response…"
						: forecast
						? `Cloud latency ${forecast.latencyMs} ms`
						: "Awaiting simulation"}
				</span>
			</div>

			<div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
				<label className="flex items-center gap-2 text-sm">
					<span className="text-slate-300">Hazard</span>
					<select
						value={hazardFilter}
						onChange={(event) => setHazardFilter(event.target.value as HazardFilter)}
						className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
						disabled={busy}
					>
						<option value="all">All types</option>
						<option value="pothole">Pothole</option>
						<option value="debris">Debris</option>
						<option value="flood">Flood</option>
					</select>
				</label>

				<label className="flex items-center gap-2 text-sm">
					<span className="text-slate-300">Horizon {horizon}h</span>
					<input
						type="range"
						min={1}
						max={48}
						value={horizon}
						onChange={(event) => setHorizon(Number(event.target.value))}
						className="h-1 w-40 cursor-pointer"
						disabled={busy}
					/>
				</label>

				<button
					onClick={() => setPlaying((prev) => !prev)}
					className="rounded-xl bg-indigo-500/80 px-4 py-2 text-sm font-semibold shadow-md transition hover:bg-indigo-400"
				>
					{playing ? "Pause" : "Play timeline"}
				</button>

				<div className="flex flex-wrap items-center gap-3 text-sm">
					<button
						onClick={() => setRngSeed((prev) => prev + 137)}
						className="rounded-lg border border-white/20 px-3 py-2 transition hover:bg-white/10"
						disabled={busy}
					>
						Regenerate Data
					</button>
					<button
						onClick={() => setRngSeed(initialSeedRef.current)}
						className="rounded-lg border border-white/20 px-3 py-2 transition hover:bg-white/10"
						disabled={busy}
					>
						Reset Seed
					</button>
					<button
						onClick={() => forecast && exportForecastJSON(forecast)}
						className="rounded-lg border border-white/20 px-3 py-2 transition hover:bg-white/10"
						disabled={!forecast}
					>
						Export JSON
					</button>
					<button
						onClick={() => forecast && exportForecastCSV(forecast)}
						className="rounded-lg border border-white/20 px-3 py-2 transition hover:bg-white/10"
						disabled={!forecast}
					>
						Export CSV
					</button>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
				<div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
					<canvas
						ref={canvasRef}
						className="h-full w-full"
						onPointerMove={handlePointerMove}
						onPointerLeave={handlePointerLeave}
					/>
					{hovered && (
						<div
							className="pointer-events-none absolute rounded-xl border border-white/20 bg-slate-900/95 px-3 py-2 text-xs shadow-lg"
							style={{ left: hovered.x + 16, top: hovered.y + 16 }}
						>
							<div className="font-semibold text-white/90">
								Prob {formatPercent(hovered.cell.prob)}
							</div>
							<div className="text-slate-300">
								Hazard: {
									Object.entries(hovered.cell.typeDist).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "n/a"
								}
							</div>
							<div className="text-slate-400">Avg severity {hovered.cell.avgSeverity.toFixed(2)}</div>
						</div>
					)}
					<div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs uppercase tracking-wide text-slate-100">
						Hour +{timelineHour} / {horizon}
					</div>
				</div>

				<div className="flex h-full flex-col gap-4">
					<div className="grid gap-3 sm:grid-cols-3">
						<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
							<div className="text-xs uppercase tracking-wide text-slate-400">City Risk Index</div>
							<div className="mt-2 text-2xl font-semibold text-emerald-400">{formatPercent(cityRiskIndex)}</div>
							<div className="mt-1 text-xs text-slate-400">Weighted average probability across high-traffic cells.</div>
						</div>
						<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
							<div className="text-xs uppercase tracking-wide text-slate-400">Est. Maintenance (24h)</div>
							<div className="mt-2 text-2xl font-semibold text-amber-300">{formatCurrency(maintenanceCost)}</div>
							<div className="mt-1 text-xs text-slate-400">Expected remediation spend based on forecast intensities.</div>
						</div>
						<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
							<div className="text-xs uppercase tracking-wide text-slate-400">Forecast Confidence</div>
							<div className="mt-2 text-2xl font-semibold text-sky-300">{formatPercent(forecastConfidence)}</div>
							<div className="mt-1 text-xs text-slate-400">Data density normalised by cell coverage.</div>
						</div>
					</div>

					<div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
						<div className="flex items-center justify-between">
							<span className="text-xs uppercase tracking-wide text-slate-400">
								Historical vs Forecast Counts
							</span>
							<span className="text-xs text-slate-400">
								Next {forecastCounts.length || 0} hours
							</span>
						</div>
						<svg viewBox="0 0 240 80" className="mt-2 w-full">
							<path
								d={buildSparkline(historicalRecent, 240, 70)}
								stroke="rgba(94,234,212,0.7)"
								strokeWidth={2}
								fill="none"
							/>
							<path
								d={buildSparkline(forecastCounts, 240, 70)}
								stroke="rgba(249,115,22,0.85)"
								strokeWidth={2}
								fill="none"
							/>
						</svg>
						<div className="mt-1 flex items-center gap-4 text-[11px] text-slate-400">
							<span className="flex items-center gap-1">
								<span className="h-1.5 w-3 rounded bg-emerald-300" /> Historical
							</span>
							<span className="flex items-center gap-1">
								<span className="h-1.5 w-3 rounded bg-amber-400" /> Forecast
							</span>
						</div>
					</div>

					<div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
						<div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
							Cloud Activity Log
						</div>
						<div className="max-h-48 overflow-y-auto px-4 py-3 text-xs text-slate-300">
							{logs.length === 0 && <div className="text-slate-500">Waiting for activity…</div>}
							{logs.map((log) => (
								<div key={log.id} className="py-1">
									<span className="text-slate-500">[{formatTime(log.ts)}]</span> {log.message}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ForecastDemo;
