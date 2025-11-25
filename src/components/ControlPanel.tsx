import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmotionalParams } from '@/lib/emotionalManifold';

interface ControlPanelProps {
  params: EmotionalParams;
  setParams: React.Dispatch<React.SetStateAction<EmotionalParams>>;
  settings: {
    resolution: number;
    showGrid: boolean;
    showVectors: boolean;
    showTrajectory: boolean;
    animateTime: boolean;
    showFiber: boolean;
    showGeodesic: boolean;
    showChristoffel: boolean;
    fiberParam: number;
    transportSpeed: number;
  };
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  onComputeGeodesic: () => void;
  onParallelTransport: () => void;
  onReset: () => void;
  onRandomize: () => void;
}

export const ControlPanel = ({
  params,
  setParams,
  settings,
  setSettings,
  onComputeGeodesic,
  onParallelTransport,
  onReset,
  onRandomize,
}: ControlPanelProps) => {
  const sliderConfig = [
    { key: 'EP', label: 'Expectation (EP)', min: -1, max: 1 },
    { key: 'P', label: 'Perception (P)', min: -1, max: 1 },
    { key: 'V', label: 'Attachment Power (V)', min: 0, max: 1 },
    { key: 'SC', label: 'Source Confidence (SC)', min: 0, max: 1 },
    { key: 'Acc', label: 'Acceptance (Acc)', min: 0, max: 1 },
    { key: 'W_p', label: 'Perspective Weight (W_p)', min: 0, max: 1 },
    { key: 'T', label: 'Time (T)', min: 0, max: 10 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-5 left-5 w-96 max-h-[90vh] overflow-y-auto glass rounded-xl p-6 shadow-2xl scrollbar-custom z-10"
    >
      <h2 className="text-xl font-bold text-neon-cyan uppercase tracking-wider mb-6 flex items-center gap-2">
        <span className="text-2xl">⚡</span> Emotional Manifold Control
      </h2>

      {/* Perception Parameters */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-neon-pink uppercase tracking-wide mb-3">📊 Perception Parameters</h3>
        {sliderConfig.map(({ key, label, min, max }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
              <span className="text-xs font-bold text-neon-cyan">{params[key as keyof EmotionalParams].toFixed(2)}</span>
            </div>
            <Slider
              value={[params[key as keyof EmotionalParams]]}
              onValueChange={(value) => setParams((prev) => ({ ...prev, [key]: value[0] }))}
              min={min}
              max={max}
              step={0.01}
              className="[&_[role=slider]]:bg-neon-cyan [&_[role=slider]]:border-neon-cyan [&_[role=slider]]:shadow-[0_0_10px_rgba(0,212,255,0.5)]"
            />
          </div>
        ))}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />

      {/* Advanced Features */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neon-pink uppercase tracking-wide mb-3">🎯 Advanced Features</h3>

        {/* Fiber Bundle */}
        <motion.div whileHover={{ scale: 1.02 }} className="glass-hover rounded-lg p-4 border border-neon-purple/30">
          <div className="font-semibold text-neon-purple text-xs mb-3">🧬 Fiber Bundle (Perspective)</div>
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Fiber Parameter</Label>
              <span className="text-xs font-bold text-neon-cyan">{settings.fiberParam.toFixed(2)}</span>
            </div>
            <Slider
              value={[settings.fiberParam]}
              onValueChange={(value) => setSettings((prev: any) => ({ ...prev, fiberParam: value[0] }))}
              min={0}
              max={1}
              step={0.01}
              className="[&_[role=slider]]:bg-neon-pink"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={settings.showFiber}
              onCheckedChange={(checked) => setSettings((prev: any) => ({ ...prev, showFiber: checked }))}
              className="border-neon-pink data-[state=checked]:bg-neon-pink"
            />
            <Label className="text-xs cursor-pointer">Show Fiber Structure</Label>
          </div>
        </motion.div>

        {/* Geodesic */}
        <motion.div whileHover={{ scale: 1.02 }} className="glass-hover rounded-lg p-4 border border-secondary/30">
          <div className="font-semibold text-secondary text-xs mb-3">📐 Geodesic Computation</div>
          <Button onClick={onComputeGeodesic} className="w-full mb-2 bg-gradient-to-r from-secondary to-neon-pink hover:opacity-90">
            Compute Geodesic Path
          </Button>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={settings.showGeodesic}
              onCheckedChange={(checked) => setSettings((prev: any) => ({ ...prev, showGeodesic: checked }))}
              className="border-secondary data-[state=checked]:bg-secondary"
            />
            <Label className="text-xs cursor-pointer">Show Geodesics</Label>
          </div>
        </motion.div>

        {/* Parallel Transport */}
        <motion.div whileHover={{ scale: 1.02 }} className="glass-hover rounded-lg p-4 border border-primary/30">
          <div className="font-semibold text-primary text-xs mb-3">🔄 Parallel Transport</div>
          <Button onClick={onParallelTransport} className="w-full mb-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            Animate Transport
          </Button>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Transport Speed</Label>
              <span className="text-xs font-bold text-neon-cyan">{settings.transportSpeed.toFixed(1)}</span>
            </div>
            <Slider
              value={[settings.transportSpeed]}
              onValueChange={(value) => setSettings((prev: any) => ({ ...prev, transportSpeed: value[0] }))}
              min={0.1}
              max={3}
              step={0.1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
        </motion.div>

        {/* Christoffel Symbols */}
        <motion.div whileHover={{ scale: 1.02 }} className="glass-hover rounded-lg p-4 border border-neon-yellow/30">
          <div className="font-semibold text-neon-yellow text-xs mb-3">Γ Christoffel Symbols</div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={settings.showChristoffel}
              onCheckedChange={(checked) => setSettings((prev: any) => ({ ...prev, showChristoffel: checked }))}
              className="border-neon-yellow data-[state=checked]:bg-neon-yellow"
            />
            <Label className="text-xs cursor-pointer">Visualize Γ Field</Label>
          </div>
        </motion.div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />

      {/* Visual Settings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neon-pink uppercase tracking-wide mb-3">🎨 Visual Settings</h3>
        {[
          { key: 'showGrid', label: 'Show Grid' },
          { key: 'showVectors', label: 'Show Vector Field' },
          { key: 'showTrajectory', label: 'Show Trajectory' },
          { key: 'animateTime', label: 'Animate Time' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              checked={settings[key as keyof typeof settings] as boolean}
              onCheckedChange={(checked) => setSettings((prev: any) => ({ ...prev, [key]: checked }))}
              className="border-primary data-[state=checked]:bg-primary"
            />
            <Label className="text-xs cursor-pointer">{label}</Label>
          </div>
        ))}

        <div className="space-y-2 pt-3">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground uppercase">Resolution</Label>
            <span className="text-xs font-bold text-neon-cyan">{settings.resolution}</span>
          </div>
          <Slider
            value={[settings.resolution]}
            onValueChange={(value) => setSettings((prev: any) => ({ ...prev, resolution: value[0] }))}
            min={20}
            max={100}
            step={5}
            className="[&_[role=slider]]:bg-accent"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-6">
        <Button onClick={onReset} className="w-full bg-gradient-to-r from-accent to-neon-purple hover:opacity-90">
          Reset View
        </Button>
        <Button onClick={onRandomize} className="w-full bg-gradient-to-r from-neon-pink to-secondary hover:opacity-90">
          Random Perception
        </Button>
      </div>
    </motion.div>
  );
};
