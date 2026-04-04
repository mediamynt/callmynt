'use client';
import { useCall } from './CallProvider';

export function CallBar() {
  const { status, isMuted, callDuration, currentCourse, endCall, mute } = useCall();
  
  if (status !== 'on-call' && status !== 'connecting') return null;
  
  const mins = Math.floor(callDuration / 60).toString().padStart(2, '0');
  const secs = (callDuration % 60).toString().padStart(2, '0');
  const timeStr = `${mins}:${secs}`;
  
  const C = {
    grn: '#10B981',
    red: '#EF4444',
    blu: '#3B82F6',
    bg: '#ffffff',
    sf: '#f8f9fa',
    bd: '#e5e7eb',
    t1: '#111827',
    t2: '#6b7280',
    t3: '#9ca3af',
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 56,
      left: 0,
      right: 0,
      height: 60,
      background: C.bg,
      borderBottom: `1px solid ${C.bd}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: status === 'on-call' ? '#dcfce7' : '#fef3c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}>
          {status === 'on-call' ? '⛳' : '⏳'}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>
            {currentCourse?.name || 'Calling...'}
          </div>
          <div style={{ fontSize: 12, color: status === 'on-call' ? C.grn : '#d97706' }}>
            {status === 'on-call' ? '● Live' : 'Connecting...'}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 600, color: C.t1 }}>
          {timeStr}
        </div>
        
        <button
          onClick={mute}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: isMuted ? C.blu : C.sf,
            color: isMuted ? 'white' : C.t2,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isMuted ? '🔇 Unmute' : '🎤 Mute'}
        </button>
        
        <button
          onClick={() => void endCall()}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: C.red,
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          📞 End
        </button>
      </div>
    </div>
  );
}
