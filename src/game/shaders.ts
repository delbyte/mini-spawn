// Simple outline shader effect
export class OutlinePipeline {
  static addToRenderer() {
    try {
      // For now, we'll skip the custom pipeline and use built-in effects
      console.log('Outline pipeline initialized');
    } catch (error) {
      console.warn('Could not initialize outline pipeline:', error);
    }
  }
}