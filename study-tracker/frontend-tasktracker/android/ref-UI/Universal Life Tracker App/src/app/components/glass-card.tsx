import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-3xl backdrop-blur-3xl
        bg-gradient-to-br from-white/[0.12] to-white/[0.04]
        border border-white/20
        shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_0_0_rgba(255,255,255,0.1)]
        relative overflow-hidden
        ${onClick ? 'cursor-pointer hover:border-white/30 hover:shadow-[0_8px_40px_0_rgba(6,214,160,0.15),inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-all duration-300' : ''}
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
      }}
    >
      {/* Specular highlight - top edge */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
        }}
      />
      
      {/* Micro-reflection glow */}
      <div 
        className="absolute top-0 left-8 right-8 h-12 opacity-40 blur-2xl"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(255,255,255,0.15) 0%, transparent 70%)',
        }}
      />
      
      {children}
    </div>
  );
}