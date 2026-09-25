"use client";

/* eslint-disable react/no-unknown-property */
import { useRef, useEffect, forwardRef, useMemo } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { EffectComposer, wrapEffect } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import * as THREE from "three";
import { ditherFragmentShader, waveFragmentShader, waveVertexShader } from "./shaders";

type RetroUniformMap = Map<"colorNum" | "pixelSize", THREE.Uniform<number>>;

class RetroEffectImpl extends Effect {
	public uniforms: RetroUniformMap;
	constructor() {
		const uniforms: RetroUniformMap = new Map([
			["colorNum", new THREE.Uniform(4.0)],
			["pixelSize", new THREE.Uniform(2.0)],
		]);
		super("RetroEffect", ditherFragmentShader, { uniforms });
		this.uniforms = uniforms;
	}
	set colorNum(value: number) {
		this.uniforms.get("colorNum")!.value = value;
	}
	get colorNum(): number {
		return this.uniforms.get("colorNum")!.value;
	}
	set pixelSize(value: number) {
		this.uniforms.get("pixelSize")!.value = value;
	}
	get pixelSize(): number {
		return this.uniforms.get("pixelSize")!.value;
	}
}

const RetroEffect = forwardRef<RetroEffectImpl, { colorNum: number; pixelSize: number }>((props, ref) => {
	const { colorNum, pixelSize } = props;
	const WrappedRetroEffect = wrapEffect(RetroEffectImpl);
	return <WrappedRetroEffect ref={ref} colorNum={colorNum} pixelSize={pixelSize} />;
});

RetroEffect.displayName = "RetroEffect";

type UniformRecord = Record<string, THREE.IUniform<unknown>>;

interface WaveUniforms extends UniformRecord {
	time: THREE.Uniform<number>;
	resolution: THREE.Uniform<THREE.Vector2>;
	waveSpeed: THREE.Uniform<number>;
	waveFrequency: THREE.Uniform<number>;
	waveAmplitude: THREE.Uniform<number>;
	waveColor: THREE.Uniform<THREE.Color>;
	mousePos: THREE.Uniform<THREE.Vector2>;
	enableMouseInteraction: THREE.Uniform<number>;
	mouseRadius: THREE.Uniform<number>;
}

interface DitheredWavesProps {
	waveSpeed: number;
	waveFrequency: number;
	waveAmplitude: number;
	waveColor: [number, number, number];
	colorNum: number;
	pixelSize: number;
	disableAnimation: boolean;
	enableMouseInteraction: boolean;
	mouseRadius: number;
}

function DitheredWaves({ waveSpeed, waveFrequency, waveAmplitude, waveColor, colorNum, pixelSize, disableAnimation, enableMouseInteraction, mouseRadius }: DitheredWavesProps) {
	const mesh = useRef<THREE.Mesh>(null);
	const mouseRef = useRef(new THREE.Vector2());
	const { viewport, size, gl } = useThree();

	const waveUniforms = useMemo(
		() => ({
			time: new THREE.Uniform(0),
			resolution: new THREE.Uniform(new THREE.Vector2(0, 0)),
			waveSpeed: new THREE.Uniform(waveSpeed),
			waveFrequency: new THREE.Uniform(waveFrequency),
			waveAmplitude: new THREE.Uniform(waveAmplitude),
			waveColor: new THREE.Uniform(new THREE.Color(...waveColor)),
			mousePos: new THREE.Uniform(new THREE.Vector2(0, 0)),
			enableMouseInteraction: new THREE.Uniform(enableMouseInteraction ? 1 : 0),
			mouseRadius: new THREE.Uniform(mouseRadius),
		}),
		// We only want to initialize this once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[]
	);

	useEffect(() => {
		const dpr = gl.getPixelRatio();
		const newWidth = Math.floor(size.width * dpr);
		const newHeight = Math.floor(size.height * dpr);
		const currentRes = waveUniforms.resolution.value;
		if (currentRes.x !== newWidth || currentRes.y !== newHeight) {
			currentRes.set(newWidth, newHeight);
		}
	}, [size, gl, waveUniforms.resolution]);

	const prevColor = useRef([...waveColor]);
	useFrame(({ clock }) => {
		const u = waveUniforms;

		if (!disableAnimation) {
			u.time.value = clock.getElapsedTime();
		}

		if (u.waveSpeed.value !== waveSpeed) u.waveSpeed.value = waveSpeed;
		if (u.waveFrequency.value !== waveFrequency) u.waveFrequency.value = waveFrequency;
		if (u.waveAmplitude.value !== waveAmplitude) u.waveAmplitude.value = waveAmplitude;

		if (!prevColor.current.every((v, i) => v === waveColor[i])) {
			u.waveColor.value.set(...waveColor);
			prevColor.current = [...waveColor];
		}

		u.enableMouseInteraction.value = enableMouseInteraction ? 1 : 0;
		u.mouseRadius.value = mouseRadius;

		if (enableMouseInteraction) {
			u.mousePos.value.copy(mouseRef.current);
		}
	});

	const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
		if (!enableMouseInteraction) return;
		const rect = gl.domElement.getBoundingClientRect();
		const dpr = gl.getPixelRatio();
		mouseRef.current.set((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
	};

	return (
		<>
			<mesh ref={mesh} scale={[viewport.width, viewport.height, 1]}>
				<planeGeometry args={[1, 1]} />
				<shaderMaterial vertexShader={waveVertexShader} fragmentShader={waveFragmentShader} uniforms={waveUniforms} />
			</mesh>

			<EffectComposer>
				<RetroEffect colorNum={colorNum} pixelSize={pixelSize} />
			</EffectComposer>

			<mesh onPointerMove={handlePointerMove} position={[0, 0, 0.01]} scale={[viewport.width, viewport.height, 1]} visible={false}>
				<planeGeometry args={[1, 1]} />
				<meshBasicMaterial transparent opacity={0} />
			</mesh>
		</>
	);
}

interface DitherProps {
	waveSpeed?: number;
	waveFrequency?: number;
	waveAmplitude?: number;
	waveColor?: [number, number, number];
	colorNum?: number;
	pixelSize?: number;
	disableAnimation?: boolean;
	enableMouseInteraction?: boolean;
	mouseRadius?: number;
}

export default function Dither({
	waveSpeed = 0.05,
	waveFrequency = 3,
	waveAmplitude = 0.3,
	waveColor = [0.5, 0.5, 0.5],
	colorNum = 4,
	pixelSize = 2,
	disableAnimation = false,
	enableMouseInteraction = true,
	mouseRadius = 1,
}: DitherProps) {
	return (
		<Canvas
			className="w-full h-full relative"
			camera={{ position: [0, 0, 6] }}
			dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.25) : 1}
			gl={{ antialias: true }}
			resize={{ scroll: false, debounce: 0 }}
			role="img"
			aria-label="Interactive retro-style dithered waves"
		>
			<DitheredWaves
				waveSpeed={waveSpeed}
				waveFrequency={waveFrequency}
				waveAmplitude={waveAmplitude}
				waveColor={waveColor}
				colorNum={colorNum}
				pixelSize={pixelSize}
				disableAnimation={disableAnimation}
				enableMouseInteraction={enableMouseInteraction}
				mouseRadius={mouseRadius}
			/>
		</Canvas>
	);
}
