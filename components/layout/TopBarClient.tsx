'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { NOTIFS } from '@/lib/mock-data';
import Link from 'next/link';

const C = {
  bg: '#FFFFFF', sf: '#F7F8FB', rs: '#EFF1F6', bd: '#E2E5ED',
  t1: '#1A1D26', t2: '#5C6070', t3: '#9198A8',
  grn: '#10B981', blu: '#3B82F6', red: '#EF4444', amb: '#F59E0B',
  bD: '#EFF6FF', bT: '#1E40AF',
};

type AgentStatus = 'available' | 'break' | 'dnd' | 'offline';

const statusColors: Record<AgentStatus, string> = {
  available: C.grn, break: C.amb, dnd: C.red, offline: C.t3,
};

function I({ children, s = 16, k = C.t3 }: { children: React.ReactNode; s?: number; k?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={k} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

type SearchResult = {
  type: 'course' | 'buyer' | 'call';
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  href: string;
};

function SearchResults({ query, onClose }: { query: string; onClose: () => void }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const items: SearchResult[] = [];
      const q = query.toLowerCase();

      // Search courses by name, city, state
      const { data: courses } = await supabase
        .from('callmynt_courses')
        .select('id, name, city, state, course_type, buyer_name, buyer_title, main_phone')
        .or(`name.ilike.%${q}%,city.ilike.%${q}%,buyer_name.ilike.%${q}%,main_phone.ilike.%${q}%`)
        .limit(8);

      if (courses) {
        for (const c of courses) {
          items.push({
            type: 'course',
            id: c.id,
            title: c.name,
            subtitle: [c.city, c.state, c.course_type].filter(Boolean).join(', '),
            icon: '⛳',
            href: `/courses/${c.id}`,
          });
          if (c.buyer_name && c.buyer_name.toLowerCase().includes(q)) {
            items.push({
              type: 'buyer',
              id: `buyer-${c.id}`,
              title: c.buyer_name,
              subtitle: `${c.buyer_title || 'Buyer'} — ${c.name}`,
              icon: '👤',
              href: `/courses/${c.id}`,
            });
          }
        }
      }

      // Search calls
      const { data: calls } = await supabase
        .from('calls')
        .select('id, disposition, spoke_to, notes, started_at, course_id')
        .or(`disposition.ilike.%${q}%,notes.ilike.%${q}%,spoke_to.ilike.%${q}%`)
        .order('started_at', { ascending: false })
        .limit(5);

      if (calls) {
        for (const call of calls) {
          items.push({
            type: 'call',
            id: call.id,
            title: call.disposition || 'Call',
            subtitle: [call.spoke_to, call.started_at ? new Date(call.started_at).toLocaleDateString() : ''].filter(Boolean).join(' · '),
            icon: '📞',
            href: '/call-library',
          });
        }
      }

      setResults(items);
      setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  if (!query || query.length < 2) {
    return (
      <div style={{ borderTop: `1px solid ${C.bd}`, padding: '16px 20px', color: C.t3, fontSize: 13 }}>
        Type to search across courses, buyers, and calls
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ borderTop: `1px solid ${C.bd}`, padding: '16px 20px', color: C.t3, fontSize: 13 }}>
        Searching...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div style={{ borderTop: `1px solid ${C.bd}`, padding: '16px 20px', color: C.t3, fontSize: 13 }}>
        No results for &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <div style={{ borderTop: `1px solid ${C.bd}`, maxHeight: 400, overflowY: 'auto' }}>
      {results.map(r => (
        <Link
          key={r.id}
          href={r.href}
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 20px', textDecoration: 'none', color: C.t1,
            borderBottom: `1px solid ${C.rs}`, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>{r.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: C.t3 }}>{r.subtitle}</div>
          </div>
          <span style={{
            fontSize: 10, color: C.t3, textTransform: 'uppercase',
            padding: '2px 8px', background: C.sf, borderRadius: 6,
            border: `1px solid ${C.bd}`, fontWeight: 600,
          }}>{r.type}</span>
        </Link>
      ))}
    </div>
  );
}

export function TopBarClient() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [avDrop, setAvDrop] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [agSt, setAgSt] = useState<AgentStatus>('available');
  const notifRef = useRef<HTMLDivElement>(null);
  const avRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (avRef.current && !avRef.current.contains(e.target as Node)) setAvDrop(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  // Cmd+K shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setAvDrop(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Search */}
      <div ref={searchRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setSearchOpen(o => !o)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${C.bd}`, background: C.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <I><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></I>
        </button>
        {searchOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)', zIndex: 999,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 100,
          }}>
            <div style={{
              width: 520, background: C.bg, borderRadius: 16,
              border: `1px solid ${C.bd}`, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <I s={20} k={C.t3}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></I>
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search courses, buyers, calls..."
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: 16,
                    fontFamily: "'DM Sans',sans-serif", color: C.t1, background: 'transparent',
                  }}
                />
                <span style={{
                  fontSize: 11, color: C.t3, padding: '2px 8px',
                  background: C.sf, borderRadius: 6, border: `1px solid ${C.bd}`,
                }}>ESC</span>
              </div>
              <SearchResults query={searchQuery} onClose={() => { setSearchOpen(false); setSearchQuery(''); }} />
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          onClick={() => { setNotifOpen(o => !o); setAvDrop(false); }}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${C.bd}`, background: C.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', position: 'relative',
          }}
        >
          <I>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </I>
          <div style={{
            position: 'absolute', top: 6, right: 6,
            width: 8, height: 8, borderRadius: '50%',
            background: C.red, border: '2px solid white',
          }} />
        </button>
        {notifOpen && (
          <div style={{
            position: 'absolute', top: 42, right: 0, width: 380,
            background: C.bg, borderRadius: 16,
            border: `1px solid ${C.bd}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            zIndex: 200, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: `1px solid ${C.bd}`,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Notifications</span>
              <button onClick={() => setNotifOpen(false)} style={{
                fontSize: 12, color: C.blu, background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 600,
              }}>Mark all read</button>
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {NOTIFS.map((n, i) => (
                <div key={i} style={{
                  padding: '14px 18px', borderBottom: `1px solid ${C.rs}`, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
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

      {/* Avatar */}
      <div ref={avRef} style={{ position: 'relative' }}>
        <button
          onClick={() => { setAvDrop(o => !o); setNotifOpen(false); }}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: C.bD, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: C.bT,
            border: 'none', cursor: 'pointer', position: 'relative',
          }}
        >
          AJ
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: '50%',
            background: statusColors[agSt], border: '2px solid white',
          }} />
        </button>
        {avDrop && (
          <div style={{
            position: 'absolute', top: 42, right: 0, width: 260,
            background: C.bg, borderRadius: 14,
            border: `1px solid ${C.bd}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            zIndex: 200, overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 18px', borderBottom: `1px solid ${C.bd}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: C.bD,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 600, color: C.bT,
              }}>AJ</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Alex Johnson</div>
                <div style={{ fontSize: 12, color: C.t3 }}>alex@byrdgang.com</div>
              </div>
            </div>
            <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.bd}` }}>
              {([
                ['available', 'Available', C.grn],
                ['break', 'On Break', C.amb],
                ['dnd', 'Do Not Disturb', C.red],
                ['offline', 'Offline', C.t3],
              ] as const).map(([id, lb, co]) => (
                <button
                  key={id}
                  onClick={() => setAgSt(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 10px', borderRadius: 8,
                    border: 'none', background: agSt === id ? C.sf : 'transparent',
                    cursor: 'pointer', fontSize: 13, color: C.t1,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: co }} />
                  {lb}
                  {agSt === id && <span style={{ marginLeft: 'auto', fontSize: 11, color: C.grn }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ padding: '6px 10px' }}>
              {['My Profile', 'Keyboard Shortcuts', 'Help & Support', 'Log Out'].map(lb => (
                <button
                  key={lb}
                  onClick={() => setAvDrop(false)}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%',
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    background: 'transparent', cursor: 'pointer', fontSize: 13,
                    color: lb === 'Log Out' ? C.red : C.t1,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >{lb}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
