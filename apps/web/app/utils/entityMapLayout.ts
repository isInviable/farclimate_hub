import type { EntityWithProjects } from "~/types/connectedCordis";
import type { GeoProjection } from "d3";

export type PlacedEntity = EntityWithProjects & {
  geoX: number;
  geoY: number;
  r: number;
  color: string;
  hasGeolocation: boolean;
};

function hashJitter(id: string, axis: "x" | "y"): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i) + (axis === "y" ? 17 : 0);
    hash |= 0;
  }
  return ((hash % 1000) / 1000) * 2 - 1;
}

function resolveCircleCollisions(
  circles: PlacedEntity[],
  maxIterations = 100
): PlacedEntity[] {
  const items = circles.map((c) => ({ ...c }));
  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]!;
        const b = items[j]!;
        const dx = b.geoX - a.geoX;
        const dy = b.geoY - a.geoY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.r + b.r + 1;
        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const ox = (dx / dist) * overlap;
          const oy = (dy / dist) * overlap;
          a.geoX -= ox;
          a.geoY -= oy;
          b.geoX += ox;
          b.geoY += oy;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return items;
}

export function layoutEntitiesOnMap(
  entities: EntityWithProjects[],
  projection: GeoProjection,
  radiusForCost: (cost: number) => number,
  colorForCount: (count: number) => string
): PlacedEntity[] {
  const placed: PlacedEntity[] = [];

  for (const entity of entities) {
    const r = radiusForCost(entity.projectsTotalCost || 0);
    const color = colorForCount(entity.projectsCount || 0);

    if (!entity.address_geolocation) {
      placed.push({ ...entity, geoX: 0, geoY: 0, r, color, hasGeolocation: false });
      continue;
    }

    const [lat, lon] = entity.address_geolocation.split(",").map((coord) => parseFloat(coord));
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      placed.push({ ...entity, geoX: 0, geoY: 0, r, color, hasGeolocation: false });
      continue;
    }

    const projected = projection([lon, lat]) ?? [0, 0];
    placed.push({
      ...entity,
      geoX: projected[0]! + hashJitter(entity.id, "x"),
      geoY: projected[1]! + hashJitter(entity.id, "y"),
      r,
      color,
      hasGeolocation: true,
    });
  }

  const withGeo = placed.filter((e) => e.hasGeolocation);
  const withoutGeo = placed.filter((e) => !e.hasGeolocation);
  return [...resolveCircleCollisions(withGeo), ...withoutGeo];
}

export function projectionSizeBucket(width: number, height: number): string {
  const w = Math.round(width / 50) * 50;
  const h = Math.round(height / 50) * 50;
  return `${w}x${h}`;
}
