export class WavRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private _recording = false;
  private sampleRate: number;

  constructor({ sampleRate = 24000 }) {
    this.sampleRate = sampleRate;
  }

  async begin() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.mediaRecorder.connect(this.analyser);
    }
  }

  async record(onData: (data: { mono: Int16Array }) => void) {
    if (!this.audioContext || !this.analyser) return;

    this._recording = true;
    const processor = this.audioContext.createScriptProcessor(2048, 1, 1);
    
    processor.onaudioprocess = (e) => {
      if (!this._recording) return;
      const input = e.inputBuffer.getChannelData(0);
      // Convert Float32Array to Int16Array
      const int16Data = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      onData({ mono: int16Data });
    };

    this.mediaRecorder?.connect(processor);
    processor.connect(this.audioContext.destination);
  }

  async pause() {
    this._recording = false;
  }

  async end() {
    this._recording = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      await this.audioContext.close();
    }
    this.audioContext = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.analyser = null;
  }

  get isRecording() {
    return this._recording;
  }

  getStatus() {
    return this._recording ? 'recording' : 'stopped';
  }

  getFrequencies(type: 'voice') {
    if (!this.analyser) return { values: new Float32Array([0]) };
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(dataArray);
    
    return { values: dataArray };
  }

  static async decode(buffer: ArrayBuffer, sampleRate: number, targetSampleRate: number): Promise<Blob> {
    const audioContext = new AudioContext({ sampleRate });
    const audioBuffer = await audioContext.decodeAudioData(buffer);
    const offlineContext = new OfflineAudioContext(1, audioBuffer.length, targetSampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();
    const renderedBuffer = await offlineContext.startRendering();
    const wav = WavRecorder.encodeWAV(renderedBuffer);
    return new Blob([wav], { type: 'audio/wav' });
  }

  private static encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const buffer = audioBuffer.getChannelData(0);
    const dataSize = buffer.length * bytesPerSample;
    const headerSize = 44;
    const wavBuffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(wavBuffer);

    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    floatTo16BitPCM(view, headerSize, buffer);

    return wavBuffer;
  }
}

export class WavStreamPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  public analyser: AnalyserNode | null = null;
  private trackId: string | null = null;
  private sampleOffset = 0;

  constructor({ sampleRate = 24000 }) {
    this.audioContext = new AudioContext({ sampleRate });
    this.gainNode = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  async connect() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async interrupt() {
    const trackInfo = this.trackId ? { trackId: this.trackId, offset: this.sampleOffset } : null;
    this.trackId = null;
    this.sampleOffset = 0;
    return trackInfo;
  }

  add16BitPCM(data: Int16Array, trackId: string) {
    if (!this.audioContext || !this.gainNode) return;

    if (this.trackId !== trackId) {
      this.trackId = trackId;
      this.sampleOffset = 0;
    }

    const buffer = this.audioContext.createBuffer(1, data.length, this.audioContext.sampleRate);
    const channel = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      channel[i] = data[i] / 32768;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.start();

    this.sampleOffset += data.length;
  }

  getFrequencies(type: 'voice') {
    if (!this.analyser) return { values: new Float32Array([0]) };
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatFrequencyData(dataArray);
    
    return { values: dataArray };
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
} 