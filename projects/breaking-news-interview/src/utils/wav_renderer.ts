export class WavRenderer {
  static drawBars(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    values: Float32Array,
    color: string,
    barWidth: number,
    barSpacing: number,
    minHeight: number
  ) {
    const width = canvas.width;
    const height = canvas.height;
    const bars = Math.floor(width / (barWidth + barSpacing));
    const step = Math.floor(values.length / bars);
    
    ctx.fillStyle = color;
    
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        const value = values[i * step + j];
        sum += value;
      }
      const average = sum / step;
      const normalizedValue = (average + 140) / 140; // Normalize from dB scale
      const barHeight = Math.max(minHeight, height * normalizedValue);
      
      ctx.fillRect(
        i * (barWidth + barSpacing),
        (height - barHeight) / 2,
        barWidth,
        barHeight
      );
    }
  }
} 