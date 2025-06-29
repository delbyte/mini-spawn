// Simple noise implementation for terrain generation
export function noise2D(x: number, y: number, seed: number = 0): number {
  // Simple pseudo-random noise function
  const hash = (x: number, y: number, seed: number) => {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    return (h ^ (h >>> 16)) / 2147483648.0;
  };

  // Get integer and fractional parts
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  // Sample noise at grid corners
  const n00 = hash(xi, yi, seed);
  const n10 = hash(xi + 1, yi, seed);
  const n01 = hash(xi, yi + 1, seed);
  const n11 = hash(xi + 1, yi + 1, seed);

  // Smooth interpolation
  const smoothstep = (t: number) => t * t * (3 - 2 * t);
  const sx = smoothstep(xf);
  const sy = smoothstep(yf);

  // Bilinear interpolation
  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;
  
  return nx0 * (1 - sy) + nx1 * sy;
}