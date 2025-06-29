export function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }