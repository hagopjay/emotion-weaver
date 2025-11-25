import * as THREE from 'three';

export interface EmotionalParams {
  EP: number;  // Expectation
  P: number;   // Perception
  V: number;   // Attachment Power
  SC: number;  // Source Confidence
  Acc: number; // Acceptance
  W_p: number; // Perspective Weight
  T: number;   // Time
}

export interface Emotions {
  happiness: number;
  sadness: number;
  fear: number;
  anger: number;
  worry: number;
}

export class EmotionalManifold {
  private kappa = {
    happiness: 2.0,
    sadness: 2.5,
    fear: 4.0,
    anger: 3.5,
    worry: 3.0,
  };

  private k_decay = {
    happiness: 0.5,
    sadness: 0.3,
    fear: 1.0,
    anger: 0.7,
    worry: 0.4,
  };

  public colors = {
    happiness: new THREE.Color(0x95e1d3),
    sadness: new THREE.Color(0x4ecdc4),
    fear: new THREE.Color(0xffe66d),
    anger: new THREE.Color(0xff6b6b),
    worry: new THREE.Color(0xf38181),
  };

  private christoffelCache: Map<string, number> = new Map();

  computeHappiness(EP: number, P: number, V: number, SC: number, Acc: number, W_p: number, T: number): number {
    const Delta = P - EP;
    const weight = V * SC * Acc * W_p;
    const scaled = this.kappa.happiness * weight * Delta;
    const decayed = scaled * Math.exp(-this.k_decay.happiness * T);
    return Math.tanh(decayed);
  }

  computeSadness(EP: number, P: number, V: number, SC: number, Acc: number, W_p: number, T: number): number {
    const Delta = Math.max(EP - P, 0);
    const weight = V * SC * Acc * W_p;
    const scaled = this.kappa.sadness * weight * Delta;
    const decayed = scaled * Math.exp(-this.k_decay.sadness * T);
    return -Math.tanh(decayed);
  }

  computeFear(EP: number, P: number, V: number, SC: number, Acc: number, W_p: number, T: number): number {
    const Delta = Math.max(EP - P, 0);
    const weight = V * SC * (1 - Acc) * W_p;
    const scaled = this.kappa.fear * weight * Delta;
    const decayed = scaled * Math.exp(-this.k_decay.fear * T);
    return Math.tanh(decayed);
  }

  computeAnger(EP: number, P: number, V: number, SC: number, Acc: number, W_ext: number, T: number): number {
    const Delta = Math.max(EP - P, 0);
    const weight = V * SC * (1 - Acc) * W_ext;
    const scaled = this.kappa.anger * weight * Delta;
    const decayed = scaled * Math.exp(-this.k_decay.anger * T);
    return Math.tanh(decayed);
  }

  computeWorry(EP: number, P: number, V: number, SC: number, Acc: number, W_p: number, T: number): number {
    const Delta = Math.max(EP - P, 0);
    const weight = V * SC * (1 - Acc) * W_p;
    const scaled = this.kappa.worry * weight * Delta;
    const decayed = scaled * Math.exp(-this.k_decay.worry * T);
    return Math.tanh(decayed);
  }

  computeAllEmotions(EP: number, P: number, V: number, SC: number, Acc: number, W_p: number, T: number): Emotions {
    const W_ext = 1 - W_p;
    return {
      happiness: this.computeHappiness(EP, P, V, SC, Acc, W_p, T),
      sadness: this.computeSadness(EP, P, V, SC, Acc, W_p, T),
      fear: this.computeFear(EP, P, V, SC, Acc, W_p, T),
      anger: this.computeAnger(EP, P, V, SC, Acc, W_ext, T),
      worry: this.computeWorry(EP, P, V, SC, Acc, W_p, T),
    };
  }

  getDominantEmotion(emotions: Emotions): { emotion: string; magnitude: number } {
    let maxMag = 0;
    let dom = 'neutral';
    for (const [e, v] of Object.entries(emotions)) {
      if (Math.abs(v) > maxMag) {
        maxMag = Math.abs(v);
        dom = e;
      }
    }
    return { emotion: dom, magnitude: maxMag };
  }

  getSeverityLabel(emotion: string, magnitude: number): string {
    const labels: Record<string, string[]> = {
      happiness: ['Satisfied', 'Pleased', 'Happy', 'Elated', 'Ecstatic'],
      sadness: ['Disappointed', 'Hurt', 'Sad', 'Grief', 'Despair'],
      fear: ['Concerned', 'Cautious', 'Afraid', 'Horror', 'Panic'],
      anger: ['Annoyed', 'Frustrated', 'Angry', 'Fury', 'Rage'],
      worry: ['Distressed', 'Nervous', 'Worried', 'Distraught', 'Dread'],
    };
    const a = Math.abs(magnitude);
    let tier = 0;
    if (a < 0.2) tier = 0;
    else if (a < 0.4) tier = 1;
    else if (a < 0.6) tier = 2;
    else if (a < 0.8) tier = 3;
    else tier = 4;
    return labels[emotion]?.[tier] || 'Neutral';
  }

  computeManifoldHeight(x: number, y: number, params: EmotionalParams): number {
    const emotions = this.computeAllEmotions(x, y, params.V, params.SC, params.Acc, params.W_p, params.T);
    let h = 0;
    let w = 0;
    for (const [e, v] of Object.entries(emotions)) {
      const wt = this.kappa[e as keyof typeof this.kappa];
      h += v * wt;
      w += wt;
    }
    return (h / (w + 1e-9)) * 2;
  }

  computeCurvature(x: number, y: number, params: EmotionalParams, h = 0.01): number {
    const z = this.computeManifoldHeight(x, y, params);
    const z_xx = (this.computeManifoldHeight(x + h, y, params) - 2 * z + this.computeManifoldHeight(x - h, y, params)) / (h * h);
    const z_yy = (this.computeManifoldHeight(x, y + h, params) - 2 * z + this.computeManifoldHeight(x, y - h, params)) / (h * h);
    const z_xy = (this.computeManifoldHeight(x + h, y + h, params) - this.computeManifoldHeight(x + h, y - h, params) - this.computeManifoldHeight(x - h, y + h, params) + this.computeManifoldHeight(x - h, y - h, params)) / (4 * h * h);
    const z_x = (this.computeManifoldHeight(x + h, y, params) - this.computeManifoldHeight(x - h, y, params)) / (2 * h);
    const z_y = (this.computeManifoldHeight(x, y + h, params) - this.computeManifoldHeight(x, y - h, params)) / (2 * h);
    const num = z_xx * z_yy - z_xy * z_xy;
    const den = Math.pow(1 + z_x * z_x + z_y * z_y, 2);
    return num / (den + 1e-10);
  }

  computeVectorField(x: number, y: number, params: EmotionalParams): THREE.Vector3 {
    const h = 0.01;
    const z = this.computeManifoldHeight(x, y, params);
    const z_x = (this.computeManifoldHeight(x + h, y, params) - z) / h;
    const z_y = (this.computeManifoldHeight(x, y + h, params) - z) / h;
    return new THREE.Vector3(-z_x, -z_y, 0).normalize();
  }

  computeMetricTensor(x: number, y: number, params: EmotionalParams, h: number): number[][] {
    const z = this.computeManifoldHeight(x, y, params);
    const z_x = (this.computeManifoldHeight(x + h, y, params) - z) / h;
    const z_y = (this.computeManifoldHeight(x, y + h, params) - z) / h;
    return [
      [1 + z_x * z_x, z_x * z_y],
      [z_x * z_y, 1 + z_y * z_y],
    ];
  }

  invertMatrix2x2(m: number[][]): number[][] {
    const d = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    if (Math.abs(d) < 1e-10) return [[1, 0], [0, 1]];
    return [
      [m[1][1] / d, -m[0][1] / d],
      [-m[1][0] / d, m[0][0] / d],
    ];
  }

  computeMetricDerivative(x: number, y: number, params: EmotionalParams, h: number, dir: 'x' | 'y'): number[][] {
    const g = this.computeMetricTensor(x, y, params, h);
    const g2 = dir === 'x' ? this.computeMetricTensor(x + h, y, params, h) : this.computeMetricTensor(x, y + h, params, h);
    return [
      [(g2[0][0] - g[0][0]) / h, (g2[0][1] - g[0][1]) / h],
      [(g2[1][0] - g[1][0]) / h, (g2[1][1] - g[1][1]) / h],
    ];
  }

  computeChristoffelSymbol(i: number, j: number, k: number, x: number, y: number, params: EmotionalParams, h = 0.01): number {
    const key = `${i}-${j}-${k}-${x.toFixed(3)}-${y.toFixed(3)}`;
    if (this.christoffelCache.has(key)) return this.christoffelCache.get(key)!;

    const g = this.computeMetricTensor(x, y, params, h);
    const g_inv = this.invertMatrix2x2(g);
    const dg_dx = this.computeMetricDerivative(x, y, params, h, 'x');
    const dg_dy = this.computeMetricDerivative(x, y, params, h, 'y');
    let gamma = 0;
    const derivs = [dg_dx, dg_dy];

    for (let l = 0; l < 2; l++) {
      const term1 = j < 2 ? derivs[j][k][l] : 0;
      const term2 = k < 2 ? derivs[k][j][l] : 0;
      const term3 = l < 2 ? derivs[l][j][k] : 0;
      gamma += 0.5 * g_inv[i][l] * (term1 + term2 - term3);
    }

    this.christoffelCache.set(key, gamma);
    return gamma;
  }

  geodesicDerivative(x: number, y: number, vx: number, vy: number, params: EmotionalParams): { ax: number; ay: number } {
    const h = 0.01;
    const Gxx = this.computeChristoffelSymbol(0, 0, 0, x, y, params, h);
    const Gxy = this.computeChristoffelSymbol(0, 0, 1, x, y, params, h);
    const Gyy = this.computeChristoffelSymbol(0, 1, 1, x, y, params, h);
    const Hxx = this.computeChristoffelSymbol(1, 0, 0, x, y, params, h);
    const Hxy = this.computeChristoffelSymbol(1, 0, 1, x, y, params, h);
    const Hyy = this.computeChristoffelSymbol(1, 1, 1, x, y, params, h);

    const ax = -(Gxx * vx * vx + 2 * Gxy * vx * vy + Gyy * vy * vy);
    const ay = -(Hxx * vx * vx + 2 * Hxy * vx * vy + Hyy * vy * vy);
    return { ax, ay };
  }

  computeGeodesic(start: { x: number; y: number }, end: { x: number; y: number }, params: EmotionalParams, steps = 100): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    const dt = 1 / steps;
    let x = start.x;
    let y = start.y;
    let vx = end.x - start.x;
    let vy = end.y - start.y;
    const vm = Math.sqrt(vx * vx + vy * vy) || 1;
    vx /= vm;
    vy /= vm;

    pts.push(new THREE.Vector3(x * 3, y * 3, this.computeManifoldHeight(x, y, params)));

    for (let s = 0; s < steps; s++) {
      const k1 = this.geodesicDerivative(x, y, vx, vy, params);
      const k2 = this.geodesicDerivative(x + 0.5 * dt * vx, y + 0.5 * dt * vy, vx + 0.5 * dt * k1.ax, vy + 0.5 * dt * k1.ay, params);
      const k3 = this.geodesicDerivative(x + 0.5 * dt * (vx + 0.5 * dt * k1.ax), y + 0.5 * dt * (vy + 0.5 * dt * k1.ay), vx + 0.5 * dt * k2.ax, vy + 0.5 * dt * k2.ay, params);
      const k4 = this.geodesicDerivative(x + dt * (vx + 0.5 * dt * k2.ax), y + dt * (vy + 0.5 * dt * k2.ay), vx + dt * k3.ax, vy + dt * k3.ay, params);

      vx += (dt / 6) * (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax);
      vy += (dt / 6) * (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay);

      x += dt * vx;
      y += dt * vy;
      const z = this.computeManifoldHeight(x, y, params);
      pts.push(new THREE.Vector3(x * 3, y * 3, z));

      if (Math.abs(x) > 1 || Math.abs(y) > 1) break;
    }

    return pts;
  }

  parallelTransport(vec: THREE.Vector2, path: THREE.Vector3[], params: EmotionalParams): Array<{ position: THREE.Vector3; vector: THREE.Vector2 }> {
    const res: Array<{ position: THREE.Vector3; vector: THREE.Vector2 }> = [];
    const h = 0.01;
    let Vx = vec.x;
    let Vy = vec.y;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const tx = p2.x - p1.x;
      const ty = p2.y - p1.y;
      const tm = Math.sqrt(tx * tx + ty * ty) || 1;
      const tnx = tx / tm;
      const tny = ty / tm;

      const x = p1.x / 3;
      const y = p1.y / 3;
      const Gxx = this.computeChristoffelSymbol(0, 0, 0, x, y, params, h);
      const Gxy = this.computeChristoffelSymbol(0, 0, 1, x, y, params, h);
      const Gyy = this.computeChristoffelSymbol(0, 1, 1, x, y, params, h);
      const Hxx = this.computeChristoffelSymbol(1, 0, 0, x, y, params, h);
      const Hxy = this.computeChristoffelSymbol(1, 0, 1, x, y, params, h);
      const Hyy = this.computeChristoffelSymbol(1, 1, 1, x, y, params, h);

      const dVx = -(Gxx * tnx * Vx + Gxy * (tnx * Vy + tny * Vx) + Gyy * tny * Vy);
      const dVy = -(Hxx * tnx * Vx + Hxy * (tnx * Vy + tny * Vx) + Hyy * tny * Vy);

      Vx += dVx * tm;
      Vy += dVy * tm;
      res.push({ position: p1.clone(), vector: new THREE.Vector2(Vx, Vy) });
    }
    return res;
  }

  computeFiberBundle(base: { x: number; y: number }, params: EmotionalParams): THREE.Vector3[] {
    const pts: THREE.Vector3[] = [];
    const N = 20;
    for (let i = 0; i <= N; i++) {
      const w_p = i / N;
      const z = this.computeManifoldHeight(base.x, base.y, { ...params, W_p: w_p });
      const fh = (w_p - 0.5) * 2;
      pts.push(new THREE.Vector3(base.x * 3, base.y * 3, z + fh));
    }
    return pts;
  }

  computeConnectionCurvature(x: number, y: number, params: EmotionalParams, h = 0.01): number {
    const loop = [{ x, y }, { x: x + h, y }, { x: x + h, y: y + h }, { x, y: y + h }, { x, y }];
    const path = loop.map((q) => new THREE.Vector3(q.x * 3, q.y * 3, this.computeManifoldHeight(q.x, q.y, params)));
    const init = new THREE.Vector2(1, 0);
    const trans = this.parallelTransport(init, path, params);

    if (trans.length > 0) {
      const fv = trans[trans.length - 1].vector;
      const ang = Math.atan2(fv.y, fv.x) - Math.atan2(init.y, init.x);
      return ang / (h * h);
    }
    return 0;
  }
}
