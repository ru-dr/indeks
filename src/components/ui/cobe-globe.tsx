"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import createGlobe from "cobe";
import { useSpring } from "react-spring";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CobeVariant =
  | "default"
  | "draggable"
  | "auto-draggable"
  | "auto-rotation"
  | "rotate-to-location"
  | "scaled"
  | "realtime";

interface Location {
  name: string;
  lat?: number;
  long?: number;
  emoji?: string;
}

interface RealtimeMarker {
  latitude: number;
  longitude: number;
  size?: number;
  color?: [number, number, number];
}

interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
}

interface CobeProps {
  variant?: CobeVariant;
  className?: string;
  style?: React.CSSProperties;
  locations?: Location[];
  realtimeMarkers?: RealtimeMarker[];

  phi?: number;
  theta?: number;
  mapSamples?: number;
  mapBrightness?: number;
  mapBaseBrightness?: number;
  diffuse?: number;
  dark?: number;
  baseColor?: string;
  markerColor?: string;
  markerSize?: number;
  glowColor?: string;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
}

type CobeState = Record<string, unknown>;

export function Cobe({
  variant = "default",
  className,
  style,
  locations = [
    { name: "San Francisco", emoji: "📍" },
    { name: "Berlin", emoji: "📍" },
    { name: "Tokyo", emoji: "📍" },
    { name: "Buenos Aires", emoji: "📍" },
  ],
  realtimeMarkers = [],

  phi = 0,
  theta = 0.2,
  mapSamples = 16000,
  mapBrightness = 1.8,
  mapBaseBrightness = 0.05,
  diffuse = 3,
  dark = 1.0,
  baseColor = "#ffffff",
  markerColor = "#fb6415",
  markerSize = 0.05,
  glowColor = "#ffffff",
  scale = 1.0,
  offsetX = 0.0,
  offsetY = 0.0,
  opacity = 0.7,
}: CobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef<number>(0);
  const focusRef = useRef<[number, number]>([0, 0]);
  const [customLocations, setCustomLocations] = useState<Location[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  const [{ r }, api] = useSpring<{ r: number }>(() => ({
    r: 0,
    config: {
      mass: 1,
      tension: 280,
      friction: 40,
      precision: 0.001,
    },
  }));

  const locationToAngles = (lat: number, long: number): [number, number] => {
    return [
      Math.PI - ((long * Math.PI) / 180 - Math.PI / 2),
      (lat * Math.PI) / 180,
    ] as [number, number];
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [0, 0, 0];
  };

  const geocodeLocation = async (
    query: string,
  ): Promise<GeocodeResult | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name,
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const geocodeLocationList = useCallback(async (locationList: Location[]) => {
    const geocodedLocations: Location[] = [];

    for (const location of locationList) {
      if (location.lat && location.long) {
        geocodedLocations.push(location);
      } else {
        const result = await geocodeLocation(location.name);
        if (result) {
          geocodedLocations.push({
            ...location,
            lat: result.lat,
            long: result.lng,
          });
        }
      }
    }

    return geocodedLocations;
  }, []);

  useEffect(() => {
    const initializeLocations = async () => {
      if (variant === "rotate-to-location" && locations.length > 0) {
        setIsInitializing(true);
        const geocoded = await geocodeLocationList(locations);
        setCustomLocations(geocoded);
        setIsInitializing(false);
      }
    };

    initializeLocations();
  }, [variant, locations, geocodeLocationList]);

  // Generate markers based on variant
  const getMarkers = useCallback((): Array<{
    location: [number, number];
    size: number;
    color?: [number, number, number];
  }> => {
    if (variant === "realtime") {
      // Only use realtime markers from props - no dummy data
      if (realtimeMarkers.length > 0) {
        return realtimeMarkers.map((marker) => ({
          location: [marker.latitude, marker.longitude] as [number, number],
          size: marker.size || markerSize,
          color: marker.color,
        }));
      }
      // Return empty array if no realtime data - no dummy markers
      return [];
    }

    if (variant === "rotate-to-location") {
      return customLocations
        .filter((loc) => loc.lat && loc.long)
        .map((loc) => ({
          location: [loc.lat!, loc.long!] as [number, number],
          size: markerSize,
        }));
    }

    // Default static markers for demo/default variants (not realtime)
    return [
      { location: [37.7595, -122.4367] as [number, number], size: markerSize },
      { location: [40.7128, -74.006] as [number, number], size: markerSize, color: [1, 0, 0] as [number, number, number] },
      { location: [35.6895, 139.6917] as [number, number], size: markerSize, color: [0, 0.5, 1] as [number, number, number] },
      { location: [-33.8688, 151.2093] as [number, number], size: markerSize, color: [0, 1, 0] as [number, number, number] },
      { location: [-22.9068, -43.1729] as [number, number], size: markerSize, color: [0.8, 0, 0.8] as [number, number, number] },
      { location: [48.8566, 2.3522] as [number, number], size: markerSize, color: [1, 1, 0] as [number, number, number] },
      { location: [41.1579, -8.6291] as [number, number], size: markerSize, color: [1, 0.5, 0] as [number, number, number] },
      { location: [37.9838, 23.7275] as [number, number], size: markerSize, color: [1, 0.5, 1] as [number, number, number] },
      { location: [41.9028, 12.4964] as [number, number], size: markerSize, color: [0.5, 0.3, 0] as [number, number, number] },
      { location: [27.7172, 85.324] as [number, number], size: markerSize, color: [0, 0.5, 1] as [number, number, number] },
      { location: [43.4643, -0.5167] as [number, number], size: markerSize, color: [0, 1, 0] as [number, number, number] },
      { location: [12.6683, -8.0076] as [number, number], size: markerSize, color: [1, 1, 0] as [number, number, number] },
      { location: [11.55, 43.1667] as [number, number], size: markerSize, color: [0.8, 0, 0.8] as [number, number, number] },
    ];
  }, [variant, realtimeMarkers, customLocations, markerSize]);

  useEffect(() => {
    let phiValue = 0;
    let width = 0;
    let currentPhi = 0;
    let currentTheta = 0;
    const doublePi = Math.PI * 2;

    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth || 400; // Default to 400 if no width
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;
    
    // Ensure we have a minimum width
    if (width === 0) width = 400;

    const markers = getMarkers();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: variant === "scaled" ? width * 2 * 0.4 : width * 2,
      phi: phiValue,
      theta: theta,
      dark: dark,
      diffuse: diffuse,
      mapSamples: mapSamples,
      mapBrightness: mapBrightness,
      mapBaseBrightness: mapBaseBrightness,
      baseColor: hexToRgb(baseColor),
      markerColor: hexToRgb(markerColor),
      glowColor: hexToRgb(glowColor),
      markers: markers,
      scale: variant === "scaled" ? 2.5 : undefined,
      offset: variant === "scaled" ? [0, width * 2 * 0.4 * 0.6] : undefined,
      opacity: opacity,
      onRender: (state: CobeState) => {
        switch (variant) {
          case "default":
          case "realtime":
            state.phi = phiValue + r.get();
            phiValue += 0.005;
            break;
          case "draggable":
            state.phi = r.get();
            break;
          case "auto-draggable":
            if (!pointerInteracting.current) {
              phiValue += 0.005;
            }
            state.phi = phiValue + r.get();
            break;
          case "auto-rotation":
            state.phi = phiValue;
            phiValue += 0.005;
            break;
          case "rotate-to-location":
            state.phi = currentPhi;
            state.theta = currentTheta;
            const [focusPhi, focusTheta] = focusRef.current;
            const distPositive = (focusPhi - currentPhi + doublePi) % doublePi;
            const distNegative = (currentPhi - focusPhi + doublePi) % doublePi;
            if (distPositive < distNegative) {
              currentPhi += distPositive * 0.08;
            } else {
              currentPhi -= distNegative * 0.08;
            }
            currentTheta = currentTheta * 0.92 + focusTheta * 0.08;
            break;
          case "scaled":
            break;
        }

        state.width = width * 2;
        state.height = variant === "scaled" ? width * 2 * 0.4 : width * 2;
      },
    });

    globeRef.current = globe;

    if (canvasRef.current) {
      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.style.opacity = opacity.toString();
        }
      });
    }

    return () => {
      globe.destroy();
      globeRef.current = null;
      window.removeEventListener("resize", onResize);
    };
  }, [
    variant,
    r,
    customLocations,
    phi,
    theta,
    mapSamples,
    mapBrightness,
    mapBaseBrightness,
    diffuse,
    dark,
    baseColor,
    markerColor,
    markerSize,
    glowColor,
    scale,
    offsetX,
    offsetY,
    opacity,
    getMarkers,
  ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (
      variant === "draggable" ||
      variant === "auto-draggable" ||
      variant === "default" ||
      variant === "realtime"
    ) {
      pointerInteracting.current =
        e.clientX - pointerInteractionMovement.current;
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    }
  };

  const handlePointerUp = () => {
    if (
      variant === "draggable" ||
      variant === "auto-draggable" ||
      variant === "default" ||
      variant === "realtime"
    ) {
      pointerInteracting.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    }
  };

  const handlePointerOut = () => {
    if (
      variant === "draggable" ||
      variant === "auto-draggable" ||
      variant === "default" ||
      variant === "realtime"
    ) {
      pointerInteracting.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (
      (variant === "draggable" ||
        variant === "auto-draggable" ||
        variant === "default" ||
        variant === "realtime") &&
      pointerInteracting.current !== null
    ) {
      const delta = e.clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      api.start({
        r: delta / 200,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      (variant === "draggable" ||
        variant === "auto-draggable" ||
        variant === "default" ||
        variant === "realtime") &&
      pointerInteracting.current !== null &&
      e.touches[0]
    ) {
      const delta = e.touches[0].clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      api.start({
        r: delta / 100,
      });
    }
  };

  const handleLocationClick = (lat: number, long: number) => {
    if (variant === "rotate-to-location") {
      focusRef.current = locationToAngles(lat, long);
    }
  };

  const containerStyle = {
    width: "100%",
    maxWidth: variant === "scaled" ? 800 : 1200,
    aspectRatio: variant === "scaled" ? 2.5 : 1,
    minHeight: variant === "scaled" ? 200 : 500,
    margin: "auto",
    position: "relative" as const,
    ...style,
  };

  const canvasStyle = {
    width: "100%",
    height: "100%",
    contain: "layout paint size" as const,
    opacity: 0,
    transition: "opacity 1s ease",
    cursor:
      variant === "draggable" ||
      variant === "auto-draggable" ||
      variant === "default" ||
      variant === "realtime"
        ? "grab"
        : undefined,
    borderRadius:
      variant === "default" ||
      variant === "draggable" ||
      variant === "auto-draggable" ||
      variant === "auto-rotation" ||
      variant === "realtime"
        ? "50%"
        : variant === "scaled"
          ? "8px"
          : undefined,
  };

  return (
    <div className={cn("", className)} style={containerStyle}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerOut}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        style={canvasStyle}
      />
      {variant === "rotate-to-location" && (
        <>
          <div
            className="control-buttons flex flex-col items-center justify-center md:flex-row"
            style={{ gap: ".5rem" }}
          >
            {isInitializing ? "Loading locations..." : ""}
            {customLocations
              .filter((loc) => loc.lat && loc.long)
              .map((location, index) => (
                <Button
                  key={index}
                  onClick={() =>
                    handleLocationClick(location.lat!, location.long!)
                  }
                  className="bg-background/80 text-foreground hover:bg-background/90 border-border transition-all duration-200 hover:scale-105"
                >
                  {location.emoji || "📍"} {location.name}
                </Button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// Export a wrapper component for realtime globe that handles data fetching
export function RealtimeGlobe({
  projectId,
  className,
  ...props
}: {
  projectId?: string;
  className?: string;
} & Omit<CobeProps, "variant" | "realtimeMarkers">) {
  const [markers, setMarkers] = useState<RealtimeMarker[]>([]);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering globe (for SSR)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchLocations = async () => {
      try {
        const url = projectId
          ? `/api/v1/analytics/${projectId}/locations`
          : "/api/v1/analytics/global/locations";

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const locations = data.locations || [];
          
          // Filter out locations without valid coordinates
          const validLocations = locations.filter(
            (loc: { latitude: number | null; longitude: number | null }) => 
              loc.latitude !== null && 
              loc.longitude !== null &&
              typeof loc.latitude === 'number' &&
              typeof loc.longitude === 'number'
          );

          const newMarkers: RealtimeMarker[] = validLocations.map(
            (loc: { latitude: number; longitude: number; visitor_count: number }) => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
              // Size based on visitor count (min 0.03, max 0.15)
              size: Math.min(0.15, Math.max(0.03, (loc.visitor_count || 1) * 0.02)),
              // Green color for active visitors
              color: [0.2, 0.9, 0.4] as [number, number, number],
            })
          );
          setMarkers(newMarkers);
          setActiveVisitors(validLocations.reduce((sum: number, loc: { visitor_count: number }) => sum + (loc.visitor_count || 0), 0));
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };

    fetchLocations();

    // Poll every 15 seconds
    const interval = setInterval(fetchLocations, 15000);
    return () => clearInterval(interval);
  }, [projectId, mounted]);

  // Don't render until mounted (prevents SSR issues with canvas)
  if (!mounted) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ minHeight: 500 }}>
        <div className="animate-pulse text-muted-foreground">Loading globe...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Cobe
        variant="realtime"
        realtimeMarkers={markers}
        className={className}
        {...props}
      />
      {/* Small indicator showing active visitor count - only when there ARE visitors */}
      {activeVisitors > 0 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
          <p className="text-xs text-muted-foreground">
            {activeVisitors} active visitor{activeVisitors !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
