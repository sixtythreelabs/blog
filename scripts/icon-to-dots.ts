#!/usr/bin/env bun
/**
 * Converts Phosphor icons or SVG files into dot-matrix style SVGs.
 * Replicates the logic from app/components/Blog/DotMatrixIcon.tsx
 *
 * Usage:
 *   bun scripts/icon-to-dots.ts --icon heart
 *   bun scripts/icon-to-dots.ts --file ./my-icon.svg --grid 32 --scale 0.8
 *   bun scripts/icon-to-dots.ts --icon arrow-right --shape square --output ./output.svg
 */

import { createCanvas, loadImage } from "@napi-rs/canvas";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";

// --- TYPES ---

interface PixelData {
	x: number;
	y: number;
}

interface Options {
	icon?: string;
	file?: string;
	grid: number;
	scale: number;
	shape: "circle" | "square";
	color: string;
	alignX: "left" | "center" | "right";
	alignY: "top" | "center" | "bottom";
	output?: string;
	weight: "regular" | "bold" | "light" | "thin" | "fill" | "duotone";
}

// --- CLI ARGUMENT PARSING ---

function parseArgs(): Options {
	const args = process.argv.slice(2);
	const options: Options = {
		grid: 24,
		scale: 0.9,
		shape: "circle",
		color: "currentColor",
		alignX: "center",
		alignY: "center",
		weight: "regular",
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		const next = args[i + 1];

		switch (arg) {
			case "--icon":
			case "-i":
				options.icon = next;
				i++;
				break;
			case "--file":
			case "-f":
				options.file = next;
				i++;
				break;
			case "--grid":
			case "-g":
				options.grid = parseInt(next, 10);
				i++;
				break;
			case "--scale":
			case "-s":
				options.scale = parseFloat(next);
				i++;
				break;
			case "--shape":
				if (next === "circle" || next === "square") {
					options.shape = next;
				}
				i++;
				break;
			case "--color":
			case "-c":
				options.color = next;
				i++;
				break;
			case "--align-x":
				if (next === "left" || next === "center" || next === "right") {
					options.alignX = next;
				}
				i++;
				break;
			case "--align-y":
				if (next === "top" || next === "center" || next === "bottom") {
					options.alignY = next;
				}
				i++;
				break;
			case "--output":
			case "-o":
				options.output = next;
				i++;
				break;
			case "--weight":
			case "-w":
				if (["regular", "bold", "light", "thin", "fill", "duotone"].includes(next)) {
					options.weight = next as Options["weight"];
				}
				i++;
				break;
			case "--help":
			case "-h":
				printHelp();
				process.exit(0);
		}
	}

	return options;
}

function printHelp(): void {
	console.log(`
icon-to-dots - Convert icons to dot-matrix SVG

USAGE:
  bun scripts/icon-to-dots.ts [OPTIONS]

OPTIONS:
  --icon, -i <name>       Phosphor icon name (e.g., 'heart', 'arrow-right')
  --file, -f <path>       Path to SVG file
  --grid, -g <number>     Grid size for sampling (default: 24)
  --scale, -s <number>    Dot scale factor 0-1 (default: 0.9)
  --shape <circle|square> Dot shape (default: circle)
  --color, -c <color>     Fill color (default: currentColor)
  --align-x <left|center|right>   Horizontal alignment (default: center)
  --align-y <top|center|bottom>   Vertical alignment (default: center)
  --weight, -w <weight>   Phosphor icon weight: regular, bold, light, thin, fill, duotone (default: regular)
  --output, -o <path>     Output file path (default: stdout)
  --help, -h              Show this help message

EXAMPLES:
  bun scripts/icon-to-dots.ts --icon heart
  bun scripts/icon-to-dots.ts --icon arrow-right --shape square --grid 32
  bun scripts/icon-to-dots.ts --file ./custom.svg --output ./output.svg
`);
}

// --- LOAD SVG ---

function loadPhosphorIcon(name: string, weight: string): string {
	// Convert PascalCase or camelCase to kebab-case
	const kebabName = name
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
		.toLowerCase();

	// Phosphor icons include weight suffix in filename (except regular)
	const fileName = weight === "regular" ? `${kebabName}.svg` : `${kebabName}-${weight}.svg`;

	// Find the phosphor-icons/core package
	const possiblePaths = [
		join(process.cwd(), "node_modules", "@phosphor-icons", "core", "assets", weight, fileName),
		join(import.meta.dir, "..", "node_modules", "@phosphor-icons", "core", "assets", weight, fileName),
	];

	for (const iconPath of possiblePaths) {
		if (existsSync(iconPath)) {
			return readFileSync(iconPath, "utf-8");
		}
	}

	throw new Error(`Could not find Phosphor icon "${name}" (tried: ${fileName}) in weight "${weight}"`);
}

function loadSvgFile(filePath: string): string {
	const resolved = resolve(filePath);
	if (!existsSync(resolved)) {
		throw new Error(`File not found: ${resolved}`);
	}
	return readFileSync(resolved, "utf-8");
}

// --- RASTERIZATION & PIXEL SAMPLING ---

async function rasterizeAndSample(svgString: string, gridSize: number): Promise<PixelData[]> {
	// Create a data URL from the SVG
	const svgBase64 = Buffer.from(svgString).toString("base64");
	const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

	// Load image and draw to canvas
	const image = await loadImage(dataUrl);
	const canvas = createCanvas(gridSize, gridSize);
	const ctx = canvas.getContext("2d");

	ctx.clearRect(0, 0, gridSize, gridSize);
	ctx.drawImage(image, 0, 0, gridSize, gridSize);

	// Get pixel data
	const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
	const data = imageData.data;
	const pixels: PixelData[] = [];

	// Sample pixels - same logic as DotMatrixIcon.tsx
	for (let y = 0; y < gridSize; y++) {
		for (let x = 0; x < gridSize; x++) {
			const index = (y * gridSize + x) * 4;
			const alpha = data[index + 3];

			if (alpha > 50) {
				pixels.push({ x, y });
			}
		}
	}

	return pixels;
}

// --- ALIGNMENT ---

function applyAlignment(pixels: PixelData[], gridSize: number, alignX: "left" | "center" | "right", alignY: "top" | "center" | "bottom"): PixelData[] {
	if (pixels.length === 0) return [];

	// Calculate bounding box of sampled pixels
	const minX = Math.min(...pixels.map((p) => p.x));
	const maxX = Math.max(...pixels.map((p) => p.x));
	const minY = Math.min(...pixels.map((p) => p.y));
	const maxY = Math.max(...pixels.map((p) => p.y));

	const contentWidth = maxX - minX + 1;
	const contentHeight = maxY - minY + 1;

	// Calculate offsets based on alignment - same logic as DotMatrixIcon.tsx
	let offsetX = 0;
	let offsetY = 0;

	if (alignX === "left") offsetX = -minX;
	else if (alignX === "right") offsetX = gridSize - 1 - maxX;
	else offsetX = Math.floor((gridSize - contentWidth) / 2) - minX;

	if (alignY === "top") offsetY = -minY;
	else if (alignY === "bottom") offsetY = gridSize - 1 - maxY;
	else offsetY = Math.floor((gridSize - contentHeight) / 2) - minY;

	// Apply offsets to all pixels
	return pixels.map((p) => ({
		x: p.x + offsetX,
		y: p.y + offsetY,
	}));
}

// --- SVG GENERATION ---

function generateDotPath(pixels: PixelData[], dotScale: number, shape: "circle" | "square"): string {
	let d = "";
	const radius = 0.5 * dotScale;

	// Same path generation logic as DotMatrixIcon.tsx
	for (const pixel of pixels) {
		const cx = pixel.x + 0.5;
		const cy = pixel.y + 0.5;

		if (shape === "square") {
			const s = radius * 2;
			const x0 = cx - radius;
			const y0 = cy - radius;
			d += `M${x0.toFixed(3)} ${y0.toFixed(3)} h${s.toFixed(3)} v${s.toFixed(3)} h-${s.toFixed(3)} Z `;
		} else {
			// Circle using arc commands
			d += `M${cx.toFixed(3)} ${cy.toFixed(3)} m -${radius.toFixed(3)}, 0 a ${radius.toFixed(3)},${radius.toFixed(3)} 0 1,0 ${(radius * 2).toFixed(3)},0 a ${radius.toFixed(3)},${radius.toFixed(
				3
			)} 0 1,0 -${(radius * 2).toFixed(3)},0 `;
		}
	}

	return d;
}

function generateSvg(path: string, gridSize: number, color: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gridSize} ${gridSize}" fill="${color}">
  <path d="${path.trim()}"/>
</svg>`;
}

// --- MAIN ---

async function main(): Promise<void> {
	const options = parseArgs();

	// Validate input
	if (!options.icon && !options.file) {
		console.error("Error: Must specify either --icon or --file");
		printHelp();
		process.exit(1);
	}

	if (options.icon && options.file) {
		console.error("Error: Cannot specify both --icon and --file");
		process.exit(1);
	}

	try {
		// 1. Load SVG
		let svgString: string;
		if (options.icon) {
			svgString = loadPhosphorIcon(options.icon, options.weight);
		} else {
			svgString = loadSvgFile(options.file!);
		}

		// 2. Rasterize and sample pixels
		const pixels = await rasterizeAndSample(svgString, options.grid);

		if (pixels.length === 0) {
			console.error("Warning: No pixels sampled from the icon");
		}

		// 3. Apply alignment
		const alignedPixels = applyAlignment(pixels, options.grid, options.alignX, options.alignY);

		// 4. Generate dot path
		const dotPath = generateDotPath(alignedPixels, options.scale, options.shape);

		// 5. Generate final SVG
		const outputSvg = generateSvg(dotPath, options.grid, options.color);

		// 6. Output
		if (options.output) {
			writeFileSync(options.output, outputSvg);
			console.error(`Written to ${options.output}`);
		} else {
			console.log(outputSvg);
		}
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

main();
