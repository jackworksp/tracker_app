import * as Dialog from '@radix-ui/react-dialog';
import { X, Clipboard, Clock } from 'lucide-react';

interface ShareDispatcherModalProps {
  open: boolean;
  onClose: () => void;
  sharedContent?: {
    title?: string;
    url?: string;
    text?: string;
  };
}

export function ShareDispatcherModal({ open, onClose, sharedContent }: ShareDispatcherModalProps) {
  const handleAddAsTask = () => {
    console.log('Adding as task:', sharedContent);
    // Logic to add as task
    onClose();
  };

  const handleLogSession = () => {
    console.log('Logging session:', sharedContent);
    // Logic to log session
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md">
          <div className="rounded-3xl backdrop-blur-3xl bg-gradient-to-br from-white/[0.15] to-white/[0.08] border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] relative overflow-hidden">
            {/* Top specular highlight */}
            <div 
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              }}
            />
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <Dialog.Title className="text-xl font-bold text-white/95">
                Share to StudyTracker
              </Dialog.Title>
              <Dialog.Close className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/60" />
              </Dialog.Close>
            </div>

            {/* Content Preview */}
            <div className="p-6 border-b border-white/10">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                {sharedContent?.title && (
                  <p className="text-white/90 mb-2">{sharedContent.title}</p>
                )}
                {sharedContent?.url && (
                  <p className="text-sm text-[#FF8C42] truncate" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }}>{sharedContent.url}</p>
                )}
                {sharedContent?.text && !sharedContent?.title && (
                  <p className="text-white/70 text-sm">{sharedContent.text}</p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              <button
                onClick={handleAddAsTask}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#06D6A0]/30 to-[#FF8C42]/20 border border-[#06D6A0]/40 flex items-center justify-center group-hover:scale-110 transition-transform relative overflow-hidden" style={{ boxShadow: '0 0 16px rgba(6,214,160,0.3)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                  <Clipboard className="w-6 h-6 text-[#06D6A0] relative z-10" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                </div>
                <div className="text-left relative z-10">
                  <div className="text-white/90 font-semibold">Add as Task</div>
                  <div className="text-sm text-white/60">Save for later</div>
                </div>
              </button>

              <button
                onClick={handleLogSession}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF8C42]/30 to-[#06D6A0]/20 border border-[#FF8C42]/40 flex items-center justify-center group-hover:scale-110 transition-transform relative overflow-hidden" style={{ boxShadow: '0 0 16px rgba(255,140,66,0.3)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                  <Clock className="w-6 h-6 text-[#FF8C42] relative z-10" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
                </div>
                <div className="text-left relative z-10">
                  <div className="text-white/90 font-semibold">Log Session</div>
                  <div className="text-sm text-white/60">Track time spent</div>
                </div>
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}