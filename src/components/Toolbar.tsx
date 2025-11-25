import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Share2, HelpCircle } from 'lucide-react';

interface ToolbarProps {
  fps: number;
  onSavePNG: () => void;
  onShare: () => void;
  onHelp: () => void;
}

export const Toolbar = ({ fps, onSavePNG, onShare, onHelp }: ToolbarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-5 right-5 glass rounded-xl p-3 shadow-2xl z-10"
    >
      <div className="flex items-center gap-2">
        <Button
          onClick={onSavePNG}
          size="sm"
          className="bg-gradient-to-r from-neon-purple to-primary hover:opacity-90"
        >
          <Download className="w-4 h-4 mr-1" />
          Save PNG
        </Button>
        <Button
          onClick={onShare}
          size="sm"
          className="bg-gradient-to-r from-secondary to-neon-pink hover:opacity-90"
        >
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </Button>
        <Button
          onClick={onHelp}
          size="sm"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10"
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
        <div className="ml-2 px-3 py-1 glass-hover rounded-lg">
          <span className="text-xs text-muted-foreground">FPS:</span>
          <span className="text-xs font-bold text-neon-cyan ml-1">{fps.toFixed(1)}</span>
        </div>
      </div>
    </motion.div>
  );
};
