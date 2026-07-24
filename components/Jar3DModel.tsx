"use client";

import { useEffect, useState, useMemo } from "react";
import * as THREE from "three";

interface Jar3DModelProps {
  topLabelUrl?: string | null;
  bottomLabelUrl?: string | null;
}

export function Jar3DModel({ topLabelUrl, bottomLabelUrl }: Jar3DModelProps) {
  const topTextureUrl = topLabelUrl || "/default-top-label.png";
  const bottomTextureUrl = bottomLabelUrl || "/default-bottom-label.png";
  
  const [topTexture, setTopTexture] = useState<THREE.Texture | null>(null);
  const [bottomTexture, setBottomTexture] = useState<THREE.Texture | null>(null);
  const [capColor, setCapColor] = useState<string>("#8b2b1a");
  const [isSafari, setIsSafari] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    loader.load(topTextureUrl, (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(1, 1);
      tex.offset.x = 0.5; // Shift to align seam at the back
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTopTexture(tex);
    });

    loader.load(bottomTextureUrl, (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(1, 1);
      tex.offset.x = 0.5; // Shift to align seam at the back
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setBottomTexture(tex);
    });
  }, [topTextureUrl, bottomTextureUrl]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;
        const colorCounts: Record<string, number> = {};
        let maxCount = 0;
        let dominantColor = "#8b2b1a";
        
        for (let i = 0; i < data.length; i += 4) {
          if (data[i+3] > 128) { // Only opaque pixels
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            // Ignore near white or near black (often text or logos)
            if ((r > 230 && g > 230 && b > 230) || (r < 25 && g < 25 && b < 25)) continue;

            // Reduce color depth to group similar shades
            const qR = Math.floor(r / 8) * 8;
            const qG = Math.floor(g / 8) * 8;
            const qB = Math.floor(b / 8) * 8;

            const hex = "#" + [qR, qG, qB].map(x => {
              const hexStr = x.toString(16);
              return hexStr.length === 1 ? "0" + hexStr : hexStr;
            }).join("");
            
            colorCounts[hex] = (colorCounts[hex] || 0) + 1;
            if (colorCounts[hex] > maxCount) {
              maxCount = colorCounts[hex];
              dominantColor = hex;
            }
          }
        }
        setCapColor(dominantColor);
      }
    };
    img.src = topTextureUrl;
  }, [topTextureUrl]);

  // Exact mm dimensions scaled by 0.1 for 3D world units
  const jarRadius = 3.202; // from 201.177 circumference
  const jarHeight = 11.75; // average of 110 and 125
  const glassThickness = 0.1;
  const slantFactor = -0.2342; // difference of 15mm over diameter 64.04mm
  
  const topLabelHeight = 6.247;
  const bottomLabelHeight = 1.313;
  const topFillerHeight = 3.0;

  const { glassGeo, coffeeGeo, topLabelGeo, bottomLabelGeo, topFillerGeo } = useMemo(() => {
    // Top label with slanted top
    const topGeo = new THREE.CylinderGeometry(jarRadius + 0.01, jarRadius + 0.01, topLabelHeight, 64, 1, true);
    const topPositions = topGeo.attributes.position;
    for (let i = 0; i < topPositions.count; i++) {
      const y = topPositions.getY(i);
      if (y > 0) {
        const z = topPositions.getZ(i);
        topPositions.setY(i, y + z * slantFactor);
      }
    }
    topGeo.computeVertexNormals();

    // Top label filler (slanted top, sits behind the top label to fill any transparent gap caused by pre-distortion)
    const fillerGeo = new THREE.CylinderGeometry(jarRadius + 0.005, jarRadius + 0.005, topFillerHeight, 64, 1, true);
    const fillerPositions = fillerGeo.attributes.position;
    for (let i = 0; i < fillerPositions.count; i++) {
      const y = fillerPositions.getY(i);
      if (y > 0) {
        const z = fillerPositions.getZ(i);
        fillerPositions.setY(i, y + z * slantFactor);
      }
    }
    fillerGeo.computeVertexNormals();

    // Bottom label (flat)
    const bottomGeo = new THREE.CylinderGeometry(jarRadius + 0.01, jarRadius + 0.01, bottomLabelHeight, 64, 1, true);

    // Glass jar (slanted top)
    const gGeo = new THREE.CylinderGeometry(jarRadius, jarRadius, jarHeight, 64, 1, false);
    const gPositions = gGeo.attributes.position;
    for (let i = 0; i < gPositions.count; i++) {
      const y = gPositions.getY(i);
      if (y > 0) {
        const z = gPositions.getZ(i);
        gPositions.setY(i, y + z * slantFactor);
      }
    }
    gGeo.computeVertexNormals();

    // Coffee contents (slanted top)
    const cGeo = new THREE.CylinderGeometry(jarRadius - glassThickness, jarRadius - glassThickness, jarHeight * 0.95, 64, 1, false);
    const cPositions = cGeo.attributes.position;
    for (let i = 0; i < cPositions.count; i++) {
      const y = cPositions.getY(i);
      if (y > 0) {
        const z = cPositions.getZ(i);
        cPositions.setY(i, y + z * slantFactor);
      }
    }
    cGeo.computeVertexNormals();

    return {
      glassGeo: gGeo,
      coffeeGeo: cGeo,
      topLabelGeo: topGeo,
      bottomLabelGeo: bottomGeo,
      topFillerGeo: fillerGeo
    };
  }, [slantFactor, topLabelHeight, bottomLabelHeight, topFillerHeight, jarRadius, jarHeight]);

  // Load Cap Logo Texture (User needs to put this in public folder)
  const [logoTexture, setLogoTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    new THREE.TextureLoader().load("/cap-logo.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      setLogoTexture(tex);
    });
  }, []);

  // Positions
  const topLabelYOffset = 0.45;
  const topLabelY = (jarHeight / 2) - (topLabelHeight / 2) + topLabelYOffset; 
  const bottomLabelY = -(jarHeight / 2) + (bottomLabelHeight / 2); // -5.875 + 0.6565 = -5.2185
  const topFillerY = (jarHeight / 2) - (topFillerHeight / 2);

  return (
    <group>
      {/* 1. Coffee Contents */}
      <mesh position={[0, -0.1, 0]} geometry={coffeeGeo}>
        <meshStandardMaterial color="#2a1610" roughness={0.9} />
      </mesh>

      {/* 2. Glass Jar Body */}
      <mesh geometry={glassGeo}>
        <meshPhysicalMaterial 
          color="#ffffff"
          transmission={1}
          opacity={1}
          metalness={0.1}
          roughness={0.1}
          ior={1.5}
          thickness={glassThickness}
          transparent={true}
        />
      </mesh>

      {/* Top Label Filler (Fills the transparent gap caused by pre-distorted images) */}
      <mesh position={[0, topFillerY, 0]} geometry={topFillerGeo}>
        <meshStandardMaterial 
          color={capColor} 
          roughness={0.3} 
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Top Label Wrap */}
      <mesh position={[0, topLabelY, 0]} geometry={topLabelGeo}>
        <meshStandardMaterial 
          map={topTexture} 
          roughness={0.3} 
          metalness={0.1}
          transparent={true}
          side={THREE.DoubleSide}
          alphaTest={0.05}
        />
      </mesh>

      {/* 4. Bottom Label Wrap */}
      <mesh position={[0, bottomLabelY, 0]} geometry={bottomLabelGeo}>
        <meshStandardMaterial 
          map={bottomTexture} 
          roughness={0.3} 
          metalness={0.1}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 5. The Cap (Top Face of the slanted label) */}
      <group 
        position={[0, (jarHeight / 2) + 0.01, 0]} 
        rotation={[-Math.PI / 2 - Math.atan(slantFactor), 0, 0]}
        scale={[1, Math.sqrt(1 + slantFactor * slantFactor), 1]}
      >
        {/* Cap Base */}
        <mesh>
          <circleGeometry args={[jarRadius + 0.015, 64]} />
          <meshStandardMaterial 
            color={capColor} // Extracted from label
            roughness={0.8} 
            metalness={0.1} 
          />
        </mesh>
        
        {/* Cap Logo */}
        {logoTexture && (
          <mesh position={[0, 0, 0.01]} rotation={[0, 0, isSafari ? Math.PI / 2 : 0]}>
            {/* Plane for the logo. Conditional rotation and aspect ratio to fix Safari/Chrome EXIF differences */}
            <planeGeometry args={isSafari ? [jarRadius * 1.0, jarRadius * 1.5] : [jarRadius * 1.5, jarRadius * 1.0]} />
            <meshStandardMaterial 
              map={logoTexture} 
              transparent={true}
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}
