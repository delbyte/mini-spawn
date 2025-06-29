import Phaser from 'phaser';

// Simple but effective bloom post-processing pipeline for Phaser 3
export class BloomPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      renderTarget: true,
      fragShader: `
        precision mediump float;
        uniform sampler2D uMainSampler;
        uniform float intensity;
        varying vec2 outTexCoord;
        void main() {
          vec4 color = texture2D(uMainSampler, outTexCoord);
          float bloom = smoothstep(0.7, 1.0, max(max(color.r, color.g), color.b));
          color.rgb += bloom * intensity * 0.5;
          gl_FragColor = color;
        }
      `
    });
  }
  onPreRender() {
    this.set1f('intensity', 1.2);
  }
}
