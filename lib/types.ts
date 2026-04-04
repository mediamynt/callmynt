// lib/types.ts - TypeScript interfaces for CallMynt

export interface Course {
  id: number;
  n: string;
  t: string;
  ci: string;
  st: string;
  ph?: string;
  pp?: string;
  b?: string;
  bt?: string;
  bs?: string;
  bp?: string;
  be?: string;
  sg: string;
  att: number;
  sam?: {
    s: string;
    sz?: string;
    co?: string;
    sh?: string;
    de?: string;
  };
  ord?: Array<{
    d: string;
    u: number;
    t: string;
  }>;
  qs?: string;
  ct?: string;
}

export interface Campaign {
  id: number;
  n: string;
  sg: string;
  ct: number;
  m: string;
}

export interface HistoryItem {
  d: string;
  w: string;
  o: string;
  n?: string;
}

export interface Recording {
  id: number;
  co: string;
  b?: string;
  ag: string;
  dt: string;
  dur: string;
  dp: string;
  sc?: number;
  sp?: string | null;
}

export interface Sample {
  id: number;
  co: string;
  b: string;
  sz: string;
  cl: string;
  s: string;
  sh: string;
  de?: string;
  ag: string;
  fu?: string | null;
  done: boolean;
  amt?: string;
}

export interface Order {
  id: number;
  co: string;
  b: string;
  dt: string;
  items: string;
  tot: string;
  pay: string;
  ful: string;
  ag: string;
}

export interface Product {
  id: string;
  n: string;
  colors: string[];
  price: number;
  img: string;
}

export interface Notification {
  t: string;
  s: string;
  tm: string;
  tp: string;
}

export interface ScriptItem {
  t: string;
  s: string;
}

export interface DispositionOption {
  l: string;
  c: string;
  a: string;
  p?: number;
  cap?: number;
}

export interface TranscriptItem {
  t: string;
  sp: string;
  tx: string;
}

export type DialerState = 'idle' | 'ready' | 'dialing' | 'ringing' | 'connected' | 'wrapup' | 'paused' | 'complete';

export type AgentStatus = 'available' | 'break' | 'dnd' | 'offline';

export interface CartItem {
  key: string;
  prod: Product;
  color: string;
  sizes: Record<string, number>;
}
