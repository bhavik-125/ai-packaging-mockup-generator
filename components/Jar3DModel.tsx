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
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTopTexture(tex);
    });

    loader.load(bottomTextureUrl, (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(1, 1);
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

  // User provided real jar measurements scaled by 0.1 for 3D units
  const radius = 3.17; 
  const capHeight = 6.021;
  const glassHeight = 4.5;
  const bottomHeight = 1.3;
  const totalHeight = capHeight + glassHeight + bottomHeight;

  const slantFactor = -0.35; // Increased slant as requested

  const { capGeo, topLabelGeo, glassGeo, bottomGeo, bottomLabelGeo, coffeeGeo, capLogoGeo } = useMemo(() => {
    // Top Cap Base (uniform radius, slanted top pivoting from the back)
    const cap = new THREE.CylinderGeometry(radius, radius, capHeight, 128, 1, false);
    const capPos = cap.attributes.position;
    for (let i = 0; i < capPos.count; i++) {
      if (capPos.getY(i) > 0) {
        // Pivot at z = -radius (back). So at back offset is 0, at front it's 2*radius*slantFactor
        capPos.setY(i, capPos.getY(i) + (capPos.getZ(i) + radius) * slantFactor);
      }
    }
    cap.computeVertexNormals();

    // Top Label (wraps around cap, straight cylinder so texture maps without distortion)
    const topLabel = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, capHeight, 128, 1, true);
    
    // Middle Glass section
    const glass = new THREE.CylinderGeometry(radius, radius, glassHeight, 128, 1, false);
    
    // Bottom Glass Base (black)
    const bottom = new THREE.CylinderGeometry(radius, radius, bottomHeight, 128, 1, false);
    // Bottom Label (wraps around bottom)
    const bottomLabel = new THREE.CylinderGeometry(radius + 0.01, radius + 0.01, bottomHeight, 128, 1, true);

    // Coffee inside (brown filler) extends through glass and bottom
    const coffee = new THREE.CylinderGeometry(radius - 0.1, radius - 0.1, glassHeight + bottomHeight - 0.1, 128, 1, false);

    // Cap Logo Disk
    const logo = new THREE.CircleGeometry(radius, 128);

    return { 
      capGeo: cap, 
      topLabelGeo: topLabel, 
      glassGeo: glass, 
      bottomGeo: bottom, 
      bottomLabelGeo: bottomLabel,
      coffeeGeo: coffee, 
      capLogoGeo: logo 
    };
  }, [slantFactor]);

  // Positions
  const capY = totalHeight / 2 - capHeight / 2;
  const glassY = totalHeight / 2 - capHeight - glassHeight / 2;
  const bottomY = -totalHeight / 2 + bottomHeight / 2;

  // Load Cap Logo Texture (User needs to put this in public folder)
  const [logoTexture, setLogoTexture] = useState<THREE.Texture | null>(null);
  const [coffeeTexture, setCoffeeTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/cap-logo.png', (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      setLogoTexture(tex);
    });
    
    // Load Coffee Beans texture
    loader.load('/coffee.png', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 2); // Repeat to scale the beans appropriately
      tex.colorSpace = THREE.SRGBColorSpace;
      setCoffeeTexture(tex);
    });
  }, []);

  return (
    <group>
      {/* Top Cap (Solid Base matching label color) */}
      <mesh position={[0, capY, 0]} geometry={capGeo}>
        <meshStandardMaterial color={capColor} roughness={0.8} />
      </mesh>

      {/* Top Label */}
      <mesh position={[0, capY, 0]} rotation={[0, Math.PI, 0]} geometry={topLabelGeo}>
        <meshStandardMaterial 
          map={topTexture}
          roughness={0.3}
          metalness={0.1}
          transparent={true}
          alphaTest={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cap Logo Disk */}
      {logoTexture && (
        <mesh 
          // Logo must also be shifted down by radius * slantFactor to match the new pivoted top face
          position={[0, totalHeight / 2 + radius * slantFactor + 0.01, 0]} 
          rotation={[-Math.PI / 2 - Math.atan(slantFactor), 0, isSafari ? Math.PI / 2 : 0]} 
          scale={[0.7, 0.7, 0.7]}
          geometry={capLogoGeo}
        >
          <meshStandardMaterial 
            map={logoTexture}
            transparent={true}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Middle Glass Jar */}
      <mesh position={[0, glassY, 0]} geometry={glassGeo}>
        <meshPhysicalMaterial 
          color="#ffffff"
          transmission={1}
          opacity={1}
          metalness={0.1}
          roughness={0}
          ior={1.5}
          thickness={0.2}
          transparent={true}
        />
      </mesh>

      {/* Coffee inside (spans both glass and bottom sections) */}
      <mesh position={[0, -capHeight / 2, 0]} geometry={coffeeGeo}>
        <meshStandardMaterial 
          color={coffeeTexture ? "#ffffff" : "#5a341f"} 
          map={coffeeTexture}
          roughness={0.9} 
        />
      </mesh>

      {/* Bottom Glass Base (transparent glass) */}
      <mesh position={[0, bottomY, 0]} geometry={bottomGeo}>
        <meshPhysicalMaterial 
          transmission={1}
          opacity={1}
          metalness={0}
          roughness={0}
          ior={1.5}
          color="#ffffff"
        />
      </mesh>

      {/* Bottom Label */}
      <mesh position={[0, bottomY, 0]} rotation={[0, Math.PI, 0]} geometry={bottomLabelGeo}>
        <meshStandardMaterial 
          map={bottomTexture}
          roughness={0.3}
          metalness={0.1}
          transparent={true}
          alphaTest={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
