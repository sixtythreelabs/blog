"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders";

const SPAN = 15;
const SIZE = 15;

const COLOR_RED = new THREE.Vector3(239 / 255, 39 / 255, 39 / 255);
const COLOR_WHITE = new THREE.Vector3(239 / 255, 239 / 255, 239 / 255);

export function VoxelCloud() {
	const meshRef = useRef<THREE.InstancedMesh>(null);
	const groupRef = useRef<THREE.Group>(null);

	// Uniforms
	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uColor1: { value: COLOR_RED },
			uColor2: { value: COLOR_WHITE },
		}),
		[]
	);

	// Generate instances
	const { positions, count } = useMemo(() => {
		const tempPositions: number[] = [];

		// Grid generation from C++:
		// for (int x = -120; x <= 120; x += span)
		//   for (int y = -450; y <= 450; y += span)
		//     for (int z = -120; z <= 120; z += span)

		for (let x = -120; x <= 120; x += SPAN) {
			for (let y = -450; y <= 450; y += SPAN) {
				for (let z = -120; z <= 120; z += SPAN) {
					tempPositions.push(x, y, z);
				}
			}
		}

		return {
			positions: new Float32Array(tempPositions),
			count: tempPositions.length / 3,
		};
	}, []);

	// Set up instance matrices once
	useMemo(() => {
		if (!meshRef.current) return;

		const tempObject = new THREE.Object3D();

		for (let i = 0; i < count; i++) {
			const x = positions[i * 3];
			const y = positions[i * 3 + 1];
			const z = positions[i * 3 + 2];

			tempObject.position.set(x, y, z);
			// C++ uses size 15. We can scale here or in geometry.
			// C++ uses `setBoxToMesh(..., size)` which implies the box is that size.
			// Standard BoxGeometry is 1x1x1. So we scale to SIZE.
			tempObject.scale.set(SIZE, SIZE, SIZE);
			tempObject.updateMatrix();

			// We can't set instanceMatrix here because ref is not attached yet in useMemo
			// But we can return the array.
		}
	}, [count, positions]);

	// Use layout effect or just ref callback to set matrices
	const setInstances = (mesh: THREE.InstancedMesh) => {
		if (!mesh) return;
		const tempObject = new THREE.Object3D();

		for (let i = 0; i < count; i++) {
			const x = positions[i * 3];
			const y = positions[i * 3 + 1];
			const z = positions[i * 3 + 2];

			tempObject.position.set(x, y, z);
			tempObject.scale.set(SIZE, SIZE, SIZE);
			tempObject.updateMatrix();
			mesh.setMatrixAt(i, tempObject.matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	};

	useFrame((state) => {
		const { clock } = state;
		const time = clock.getElapsedTime() * 60; // scale to match roughly frames if needed, but shader expects generic time
		// C++: ofGetFrameNum() * 1.44 for rotation
		// C++: ofGetFrameNum() * 0.01 for noise

		// Let's use time directly.
		// If 60fps, 1 frame = 1/60s.
		// So ofGetFrameNum() ~ time * 60.

		// Shader noise time: frame * 0.01 -> (time * 60) * 0.01 = time * 0.6
		uniforms.uTime.value = time * 0.3; // Slow down noise effect significantly

		// Rotation
		// ofRotateY(ofGetFrameNum() * 1.44); -> degrees
		// In radians: (frame * 1.44) * (PI / 180)
		// = (time * 60 * 1.44) * 0.01745
		// = time * 1.5 roughly
		if (groupRef.current) {
			groupRef.current.rotation.y = time * 0.02; // Slow down a bit if it's too fast
		}
	});

	return (
		<group ref={groupRef}>
			<instancedMesh ref={setInstances} args={[undefined, undefined, count]}>
				<boxGeometry args={[0.99, 0.99, 0.99]} />
				<shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent={false} side={THREE.DoubleSide} />
			</instancedMesh>
		</group>
	);
}
