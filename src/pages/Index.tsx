import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useManifoldVisualization } from '@/hooks/useManifoldVisualization';
import { ControlPanel } from '@/components/ControlPanel';
import { StatsPanel } from '@/components/StatsPanel';
import { InfoPanel } from '@/components/InfoPanel';
import { Toolbar } from '@/components/Toolbar';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const {
    params,
    setParams,
    settings,
    setSettings,
    fps,
    manifold,
    computeGeodesic,
    animateParallelTransport,
    resetCamera,
    randomizeParams,
  } = useManifoldVisualization(canvasRef);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'g':
          setSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }));
          break;
        case 'v':
          setSettings((prev) => ({ ...prev, showVectors: !prev.showVectors }));
          break;
        case 't':
          setSettings((prev) => ({ ...prev, showTrajectory: !prev.showTrajectory }));
          break;
        case ' ':
          e.preventDefault();
          setSettings((prev) => ({ ...prev, animateTime: !prev.animateTime }));
          break;
        case 'r':
          randomizeParams();
          toast({ title: 'Parameters Randomized', description: 'New perception state generated' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSavePNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'emotional_manifold.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
    toast({ title: 'PNG Saved', description: 'Image downloaded successfully' });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: 'Link Copied', description: 'Share link copied to clipboard' });
    });
  };

  const handleHelp = () => {
    toast({
      title: '🌌 Emotional Manifold Guide',
      description: 'Use sliders to control emotional parameters. Press G/V/T for visual toggles, Space to pause time, R to randomize.',
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, hsl(190 100% 50%) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, hsl(330 100% 70%) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 80%, hsl(260 60% 60%) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, hsl(190 100% 50%) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* UI Overlay */}
      <ControlPanel
        params={params}
        setParams={setParams}
        settings={settings}
        setSettings={setSettings}
        onComputeGeodesic={() => {
          computeGeodesic();
          toast({ title: 'Geodesic Computed', description: 'Shortest emotional path calculated' });
        }}
        onParallelTransport={() => {
          animateParallelTransport();
          toast({ title: 'Transport Started', description: 'Parallel transport animation in progress' });
        }}
        onReset={() => {
          resetCamera();
          toast({ title: 'View Reset', description: 'Camera position restored' });
        }}
        onRandomize={() => {
          randomizeParams();
          toast({ title: 'Parameters Randomized', description: 'New perception state generated' });
        }}
      />

      <StatsPanel manifold={manifold} params={params} />
      <InfoPanel />
      <Toolbar fps={fps} onSavePNG={handleSavePNG} onShare={handleShare} onHelp={handleHelp} />
    </div>
  );
};

export default Index;
