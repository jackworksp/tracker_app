import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';

interface AddSessionModalProps {
  open: boolean;
  onClose: () => void;
  prefilledTitle?: string;
}

export function AddSessionModal({ open, onClose, prefilledTitle = '' }: AddSessionModalProps) {
  const [formData, setFormData] = useState({
    type: 'Study',
    activity: prefilledTitle,
    url: '',
    hours: '',
    topics: '',
    notes: '',
  });

  const types = ['Study', 'Watch', 'Read', 'Course'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Session data:', formData);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md max-h-[85vh] overflow-y-auto">
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
                Log Session
              </Dialog.Title>
              <Dialog.Close className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/60" />
              </Dialog.Close>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type Selector */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Type</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {types.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`
                        px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all relative overflow-hidden
                        ${formData.type === type
                          ? 'bg-gradient-to-br from-[#06D6A0]/30 to-[#FF8C42]/20 border-[#06D6A0]/50 text-[#06D6A0]'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                        }
                        border
                      `}
                      style={formData.type === type ? { boxShadow: '0 0 16px rgba(6,214,160,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' } : {}}
                    >
                      {formData.type === type && (
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
                      )}
                      <span className="relative z-10">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Activity Title *
                </label>
                <input
                  type="text"
                  value={formData.activity}
                  onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                  placeholder="What did you work on?"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#06D6A0]/50 focus:border-[#06D6A0]/50 backdrop-blur-sm transition-all"
                  required
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#06D6A0]/50 focus:border-[#06D6A0]/50 backdrop-blur-sm transition-all"
                />
              </div>

              {/* Time Spent */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Time Spent (hours) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="1.5"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#06D6A0]/50 focus:border-[#06D6A0]/50 backdrop-blur-sm transition-all"
                  required
                />
              </div>

              {/* Topics */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Topics (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.topics}
                  onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                  placeholder="React, Hooks, TypeScript"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#06D6A0]/50 focus:border-[#06D6A0]/50 backdrop-blur-sm transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-white/60 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#06D6A0]/50 focus:border-[#06D6A0]/50 resize-none backdrop-blur-sm transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/20 text-white/90 hover:bg-white/10 transition-all relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
                  <span className="relative z-10">Cancel</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#06D6A0] to-[#FF8C42] text-white font-semibold transition-all relative overflow-hidden"
                  style={{ boxShadow: '0 0 24px rgba(6,214,160,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                  <span className="relative z-10">Save Session</span>
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}