import { motion } from 'framer-motion';
import { EmotionalManifold, EmotionalParams } from '@/lib/emotionalManifold';

interface StatsPanelProps {
  manifold: EmotionalManifold;
  params: EmotionalParams;
}

export const StatsPanel = ({ manifold, params }: StatsPanelProps) => {
  const emotions = manifold.computeAllEmotions(params.EP, params.P, params.V, params.SC, params.Acc, params.W_p, params.T);
  const dom = manifold.getDominantEmotion(emotions);
  const severity = manifold.getSeverityLabel(dom.emotion, dom.magnitude);

  const curvature = manifold.computeCurvature(params.EP, params.P, params, 0.01);
  const vectorField = manifold.computeVectorField(params.EP, params.P, params);
  const energy = Object.values(emotions).reduce((sum, val) => sum + Math.abs(val), 0);
  const connectionCurv = manifold.computeConnectionCurvature(params.EP, params.P, params, 0.05);
  const christoffel = manifold.computeChristoffelSymbol(0, 0, 0, params.EP, params.P, params);

  const stats = [
    { label: 'Gaussian Curvature (K)', value: curvature.toFixed(4) },
    { label: 'Vector Magnitude', value: vectorField.length().toFixed(3) },
    { label: 'Emotional Energy', value: energy.toFixed(3) },
    { label: 'Dominant Emotion', value: `${dom.emotion.charAt(0).toUpperCase() + dom.emotion.slice(1)} (${severity})` },
    { label: 'Connection Curvature (Ω)', value: connectionCurv.toFixed(4) },
    { label: 'Christoffel Γ¹₁₁', value: christoffel.toFixed(4) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-5 right-5 w-72 glass rounded-xl p-5 shadow-2xl z-10"
    >
      <h2 className="text-lg font-bold text-neon-cyan uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>📈</span> Manifold Statistics
      </h2>

      <div className="space-y-3">
        {stats.map(({ label, value }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex justify-between items-center pb-2 border-b border-border/50"
          >
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-bold text-neon-cyan">{value}</span>
          </motion.div>
        ))}
      </div>

      {/* Current Emotions Display */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-neon-pink uppercase tracking-wide mb-3">💭 Current Emotions</h3>
        <div className="space-y-2">
          {Object.entries(emotions).map(([emotion, value]) => {
            const sev = manifold.getSeverityLabel(emotion, value);
            const width = Math.abs(value) * 100;
            const color = manifold.colors[emotion as keyof typeof manifold.colors].getStyle();

            return (
              <motion.div
                key={emotion}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-hover rounded-lg p-2 border border-border/30"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs capitalize">{emotion}</span>
                  <span className="text-xs font-bold text-neon-cyan">{sev}</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
