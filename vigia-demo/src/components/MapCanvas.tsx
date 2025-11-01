"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Pos = { lat: number; lng: number; headingDeg: number; speedKmh: number };

type Props = {
  pos: Pos;
  onPosChange: (p: Pos) => void;
  hazards?: GeoJSON.FeatureCollection;
  /** keep map centered on user */
  follow?: boolean;
  /** default zoom to use when following */
  zoom?: number;
  /** optional className/style for container */
  className?: string;
  style?: React.CSSProperties;
};

export default function MapCanvas({
  pos,
  onPosChange,
  hazards,
  follow = true,
  zoom = 15,
  className,
  style,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const loadedRef = useRef(false);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      } as any,
      center: [pos.lng, pos.lat],
      zoom,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    // user marker (blue dot)
    const marker = new maplibregl.Marker({ draggable: true, color: "#3b82f6" })
      .setLngLat([pos.lng, pos.lat])
      .addTo(map);

    marker.on("dragend", () => {
      const ll = marker.getLngLat();
      onPosChange({ ...pos, lat: ll.lat, lng: ll.lng });
    });
    markerRef.current = marker;

    const onLoad = () => {
      loadedRef.current = true;

      // hazards source/layer
      if (!map.getSource("hazards")) {
        map.addSource("hazards", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "haz-circles",
          type: "circle",
          source: "hazards",
          paint: {
            "circle-radius": 6,
            "circle-color": [
              "match",
              ["get", "class"],
              "pothole",
              "#ef4444",
              "speed_breaker_unmarked",
              "#f59e0b",
              "debris",
              "#8b5cf6",
              "stalled_vehicle",
              "#10b981",
              "#334155",
            ],
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#111827",
          },
        });
      }

      // if hazards already arrived before load, push now
      if (hazards) {
        (map.getSource("hazards") as any)?.setData(hazards);
      }
    };

    map.on("load", onLoad);

    return () => {
      map.off("load", onLoad);
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep marker and (optionally) map centered on user
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    markerRef.current.setLngLat([pos.lng, pos.lat]);

    if (follow) {
      // smooth but snappy enough for 1Hz updates
      mapRef.current.easeTo({
        center: [pos.lng, pos.lat],
        zoom,
        duration: 400,
        animate: true,
        easing: (t) => t, // linear
      });
    }
  }, [pos.lat, pos.lng, follow, zoom]);

  // update hazard data whenever it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const set = () => {
      (map.getSource("hazards") as any)?.setData(
        hazards ?? { type: "FeatureCollection", features: [] }
      );
    };

    if (loadedRef.current) set();
    else map.once("load", set);
  }, [hazards]);

  // allow container to size via parent
  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
      aria-label="Map"
    />
  );
}