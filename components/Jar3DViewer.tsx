"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Jar3DModel } from "./Jar3DModel";

interface Jar3DViewerProps {
  topLabelUrl?: string | null;
  bottomLabelUrl?: string | null;
}

export function Jar3DViewer({ topLabelUrl, bottomLabelUrl }: Jar3DViewerProps) {
  return (
    <div className="w-full h-full min-h-[400px] bg-[#111111] rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 2, 18], fov: 45 }}>
        <color attach="background" args={["#111111"]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={null}>
          <Jar3DModel topLabelUrl={topLabelUrl} bottomLabelUrl={bottomLabelUrl} />
          {/* Environment maps for realistic glass reflections */}
          <Environment preset="city" />
        </Suspense>

        {/* Soft shadow under the jar */}
        <ContactShadows 
          position={[0, -5.9, 0]} 
          opacity={0.4} 
          scale={15} 
          blur={2.5} 
          far={5} 
        />
        
        <OrbitControls 
          enablePan={true} 
          enableDamping={true}
          dampingFactor={0.05}
          zoomSpeed={1.2}
          panSpeed={1.2}
          minPolarAngle={Math.PI / 8} 
          maxPolarAngle={Math.PI / 1.3}
          minDistance={3.5}
          maxDistance={40}
        />
      </Canvas>
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-[12px] text-gray-500 font-medium">Drag to rotate • Scroll to zoom • Right-click to pan</p>
      </div>
    </div>
  );
}
