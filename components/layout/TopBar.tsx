'use client';

import { useState } from 'react';
import { C } from '@/lib/constants';
import { Icon } from '@/components/shared/Icon';
import { MonoText } from '@/components/shared/MonoText';
import { NOTIFS } from '@/lib/mock-data';
import { AgentStatus } from '@/lib/types';

interface TopBarProps {
  onSearch: () => void;
  onNotif: () => void;
  notifOpen: boolean;
  onNavigate: (page: string) => void;
}

export function TopBar({ onSearch, onNotif, notifOpen, onNavigate }: TopBarProps) {
  const [avDrop, setAvDrop] = useState(false);
  const [agSt, setAgSt] = useState<AgentStatus>('available');

  const statusColors: Record<AgentStatus, string> = {
    available: C.grn,
    break: C.amb,
    dnd: C.red,
    offline: C.t3,
  };

  return (
    <div
      style={{
        gridColumn: '1/-1',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: `1px solid ${C.bd}`,
        gap: 12,
        position: 'relative',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        <Icon s={20} k={C.grn}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </Icon>
        <span>Call</span>
        <span style={{ color: C.grn }}>Mynt</span>
      </div>

      {/* Stats */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {[
          ['Dials', 247],
          ['Connects', 38, C.grn],
          ['Samples', 8, C.pur],
          ['Orders', 3, C.blu],
        ].map(([l, v, c]) => (
          <div
            key={l as string}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: C.sf,
              borderRadius: 8,
              border: `1px solid ${C.bd}`,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: C.t3,
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              {l as string}
            </span>
            <MonoText s={13} c={c as string}>
              {v as number}
            </MonoText>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onSearch}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: `1px solid ${C.bd}`,
            background: C.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon s={16} k={C.t3}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </Icon>
        </button>
        <button
          onClick={() => onNotif()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: `1px solid ${C.bd}`,
            background: C.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <Icon s={16} k={C.t3}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </Icon>
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.red,
              border: '2px solid white',
            }}
          />
        </button>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setAvDrop(!avDrop);
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: C.bD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: C.bT,
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            AJ
            <div
              style={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: statusColors[agSt],
                border: '2px solid white',
              }}
            />
          </button>

          {avDrop && (
            <div
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                width: 260,
                background: C.bg,
                borderRadius: 14,
                border: `1px solid ${C.bd}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '16px 18px',
                  borderBottom: `1px solid ${C.bd}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: C.bD,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.bT,
                  }}
                >
                  AJ
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Alex Johnson</div>
                  <div style={{ fontSize: 12, color: C.t3 }}>alex@byrdgang.com</div>
                </div>
              </div>
              <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.bd}` }}>
                {[
                  ['available', 'Available', C.grn],
                  ['break', 'On Break', C.amb],
                  ['dnd', 'Do Not Disturb', C.red],
                  ['offline', 'Offline', C.t3],
                ].map(([id, lb, co]) => (
                  <button
                    key={id as string}
                    onClick={() => setAgSt(id as AgentStatus)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: agSt === id ? C.sf : 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: C.t1,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: co as string,
                      }}
                    />
                    {lb as string}
                    {agSt === id && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: C.grn }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
              <div style={{ padding: '6px 10px' }}>
                {[
                  ['My Profile', 'settings'],
                  ['Keyboard Shortcuts', null],
                  ['Help & Support', null],
                  ['Log Out', null],
                ].map(([lb, pg2]) => (
                  <button
                    key={lb as string}
                    onClick={() => {
                      if (pg2) {
                        onNavigate(pg2 as string);
                      }
                      setAvDrop(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: lb === 'Log Out' ? C.red : C.t1,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {lb as string}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Dropdown */}
      {notifOpen && (
        <div
          style={{
            position: 'absolute',
            top: 52,
            right: 16,
            width: 380,
            background: C.bg,
            borderRadius: 16,
            border: `1px solid ${C.bd}`,
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${C.bd}`,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>Notifications</span>
            <button
              onClick={() => onNotif()}
              style={{
                fontSize: 12,
                color: C.blu,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Mark all read
            </button>
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {NOTIFS.map((n, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 18px',
                  borderBottom: `1px solid ${C.rs}`,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{n.t}</span>
                  <span style={{ fontSize: 11, color: C.t3 }}>{n.tm}</span>
                </div>
                <div style={{ fontSize: 13, color: C.t2 }}>{n.s}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
