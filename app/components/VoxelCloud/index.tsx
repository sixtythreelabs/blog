"use client";

import { Canvas } from "@react-three/fiber";
import { VoxelCloud } from "./VoxelCloud";
import { Suspense } from "react";

export default function VoxelCloudWrapper() {
	return (
		<div className="w-full h-full relative min-h-[200px]">
			<Canvas
				className="w-full h-full"
				camera={{ position: [0, 0, 900], fov: 45, near: 1, far: 3000 }}
				dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
				gl={{ antialias: true, alpha: true }}
			>
				<Suspense fallback={null}>
					<VoxelCloud />
				</Suspense>
			</Canvas>
		</div>
	);
}
