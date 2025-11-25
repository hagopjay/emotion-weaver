import { motion } from 'framer-motion';

export const InfoPanel = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-5 left-5 w-96 glass rounded-xl p-5 shadow-2xl z-10"
    >
      <h3 className="text-sm font-bold text-neon-cyan mb-2">🌌 Advanced Emotional Manifold</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        Visualizing emotions as Riemannian geometry with fiber bundles, geodesics, and parallel transport.
      </p>

      <div className="space-y-1 text-xs">
        <p className="font-semibold text-foreground mb-2">Advanced Features:</p>
        <div className="space-y-1 text-muted-foreground">
          <p>• <span className="font-medium text-neon-pink">Fiber Bundle:</span> Multiple perspective layers</p>
          <p>• <span className="font-medium text-neon-pink">Geodesics:</span> Shortest emotional paths</p>
          <p>• <span className="font-medium text-neon-pink">Parallel Transport:</span> Empathy mechanics</p>
          <p>• <span className="font-medium text-neon-pink">Christoffel Symbols:</span> Connection coefficients</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs font-semibold text-foreground mb-2">Keyboard Shortcuts:</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">G</kbd> Toggle Grid</div>
          <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">V</kbd> Toggle Vectors</div>
          <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">T</kbd> Toggle Trajectory</div>
          <div><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Space</kbd> Pause Time</div>
        </div>
      </div>
    </motion.div>
  );
};
