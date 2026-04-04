// lib/mock-data.ts - Mock data from CallMyntApp-v4.jsx

import { Course, Campaign, HistoryItem, Recording, Sample, Order, Product, Notification } from './types';

export const CO: Course[] = [
  { id: 1, n: "Riverside Golf Club", t: "Public", ci: "Draper", st: "UT", ph: "(801) 555-0140", pp: "(801) 555-0141", b: "Mike Thompson", bt: "Head Pro", bs: "XL", bp: "(801) 555-0142", be: "mike@riversidegc.com", sg: "sample_follow_up", att: 4, sam: { s: "delivered", sz: "XL", co: "Navy", sh: "Mar 29", de: "Apr 1" }, qs: "live" },
  { id: 2, n: "Eagle Ridge GC", t: "Semi-Priv", ci: "Lehi", st: "UT", ph: "(801) 555-0200", sg: "cold_list", att: 0, qs: "ringing" },
  { id: 3, n: "Sunbrook Golf Course", t: "Public", ci: "St. George", st: "UT", ph: "(435) 555-0300", b: "Jeff Willis", bt: "Pro Shop Mgr", sg: "buyer_identified", att: 2, qs: "queued" },
  { id: 4, n: "Valley View Golf", t: "Municipal", ci: "Layton", st: "UT", ph: "(801) 555-0400", sg: "cold_list", att: 1, qs: "queued" },
  { id: 5, n: "Thanksgiving Point GC", t: "Public", ci: "Lehi", st: "UT", b: "Sarah Chen", bt: "Retail Mgr", bs: "M", sg: "first_order", att: 6, sam: { s: "converted" }, ord: [{ d: "Mar 18", u: 36, t: "$900" }], qs: "done", ct: "3:22" },
  { id: 6, n: "Fox Hollow GC", t: "Public", ci: "Am. Fork", st: "UT", b: "Dave Martinez", bt: "PGA Pro", bs: "L", sg: "sending_sample", att: 3, sam: { s: "in_transit", sz: "L", co: "Forest", sh: "Mar 31" }, qs: "queued" },
  { id: 7, n: "Hobble Creek Golf", t: "Public", ci: "Springville", st: "UT", ph: "(801) 555-0600", sg: "cold_list", att: 0, qs: "queued" },
  { id: 8, n: "Stonebridge GC", t: "Private", ci: "W. Valley", st: "UT", ph: "(801) 555-0800", sg: "cold_list", att: 0, qs: "queued" },
  { id: 9, n: "The Ledges GC", t: "Semi-Priv", ci: "St. George", st: "UT", b: "Tom Reeves", bt: "Dir. Golf", sg: "reorder", att: 8, ord: [{ d: "Feb 10", u: 48, t: "$1,200" }, { d: "Mar 22", u: 24, t: "$600" }], qs: "queued" },
  { id: 10, n: "Wasatch State Park GC", t: "Public", ci: "Midway", st: "UT", ph: "(435) 555-0900", sg: "cold_list", att: 2, qs: "queued" },
];

export const CAMPS: Campaign[] = [
  { id: 1, n: "Cold List — Utah", sg: "cold_list", ct: 142, m: "power" },
  { id: 2, n: "Buyer Follow-ups", sg: "buyer_identified", ct: 23, m: "preview" },
  { id: 3, n: "Sample Follow-ups", sg: "sample_follow_up", ct: 8, m: "power" },
  { id: 4, n: "Reorder Check-ins", sg: "reorder", ct: 4, m: "preview" },
];

export const HIST: HistoryItem[] = [
  { d: "Mar 28", w: "Gatekeeper", o: "Got buyer name", n: "In before 9am" },
  { d: "Mar 25", w: "VM", o: "Left voicemail" },
  { d: "Mar 20", w: "Gatekeeper", o: "No buyer avail", n: "Try mornings" },
  { d: "Mar 15", w: "VM", o: "Left voicemail" },
];

export const RECS: Recording[] = [
  { id: 1, co: "Riverside Golf Club", b: "Mike Thompson", ag: "Alex", dt: "Mar 28", dur: "2:34", dp: "Got buyer name", sc: 78, sp: "Gatekeeper" },
  { id: 2, co: "Thanksgiving Point", b: "Sarah Chen", ag: "Alex", dt: "Mar 15", dur: "4:12", dp: "Placing order", sc: 94, sp: "Buyer" },
  { id: 3, co: "Eagle Ridge GC", ag: "Jordan", dt: "Mar 27", dur: "0:45", dp: "No answer", sp: null },
  { id: 4, co: "Fox Hollow GC", b: "Dave Martinez", ag: "Alex", dt: "Mar 30", dur: "3:08", dp: "Sending sample", sc: 82, sp: "Buyer" },
  { id: 5, co: "Sunbrook GC", b: "Jeff Willis", ag: "Jordan", dt: "Mar 25", dur: "1:22", dp: "Got buyer name", sc: 71, sp: "Gate" },
  { id: 6, co: "The Ledges GC", b: "Tom Reeves", ag: "Alex", dt: "Mar 22", dur: "2:55", dp: "Placing order", sc: 91, sp: "Buyer" },
];

export const SAMPS: Sample[] = [
  { id: 1, co: "Riverside Golf Club", b: "Mike Thompson", sz: "XL", cl: "Navy", s: "delivered", sh: "Mar 29", de: "Apr 1", ag: "Alex", fu: "Apr 3", done: false },
  { id: 2, co: "Fox Hollow GC", b: "Dave Martinez", sz: "L", cl: "Forest", s: "in_transit", sh: "Mar 31", ag: "Alex", fu: null, done: false },
  { id: 3, co: "Thanksgiving Point", b: "Sarah Chen", sz: "M", cl: "Charcoal", s: "converted", sh: "Mar 5", de: "Mar 8", ag: "Alex", fu: "Mar 10", done: true, amt: "$900" },
  { id: 4, co: "The Ledges GC", b: "Tom Reeves", sz: "L", cl: "Navy", s: "converted", sh: "Jan 28", de: "Feb 1", ag: "Alex", fu: "Feb 3", done: true, amt: "$1,200" },
];

export const ORDS: Order[] = [
  { id: 1001, co: "Thanksgiving Point GC", b: "Sarah Chen", dt: "Mar 18", items: "36 units — Navy, Charcoal", tot: "$900", pay: "Paid", ful: "Delivered", ag: "Alex" },
  { id: 1002, co: "The Ledges GC", b: "Tom Reeves", dt: "Mar 22", items: "24 units — Navy", tot: "$600", pay: "Paid", ful: "Shipped", ag: "Alex" },
  { id: 1003, co: "The Ledges GC", b: "Tom Reeves", dt: "Feb 10", items: "48 units — Navy, Forest", tot: "$$1,200", pay: "Paid", ful: "Delivered", ag: "Alex" },
];

export const PRODS: Product[] = [
  { id: "p1", n: "Performance Polo", colors: ["Navy", "Charcoal", "Forest", "Black", "White"], price: 25, img: "👔" },
  { id: "p2", n: "Quarter Zip Pullover", colors: ["Navy", "Charcoal", "Black", "Heather Grey"], price: 35, img: "🧥" },
  { id: "p3", n: "Dry-Fit Polo", colors: ["Navy", "White", "Forest", "Royal Blue"], price: 25, img: "👕" },
  { id: "p4", n: "Lightweight Vest", colors: ["Black", "Navy", "Charcoal"], price: 40, img: "🦺" },
  { id: "p5", n: "Performance Hoodie", colors: ["Black", "Navy", "Charcoal", "Forest"], price: 45, img: "🧶" },
  { id: "p6", n: "Classic Polo", colors: ["Navy", "White", "Black", "Charcoal", "Red", "Royal Blue"], price: 22, img: "👔" },
  { id: "p7", n: "Moisture-Wick Tee", colors: ["White", "Black", "Navy", "Heather Grey"], price: 18, img: "👕" },
  { id: "p8", n: "Wind Jacket", colors: ["Black", "Navy"], price: 50, img: "🧥" },
];

export const NOTIFS: Notification[] = [
  { t: "Sample delivered", s: "Riverside Golf Club — follow up due Apr 3", tm: "2h ago", tp: "sample" },
  { t: "Voicemail received", s: "Fox Hollow GC — Dave wants to place an order", tm: "4h ago", tp: "vm" },
  { t: "Order payment received", s: "The Ledges GC — $600 for Order #1002", tm: "1d ago", tp: "order" },
  { t: "Coaching report", s: "Weekly coaching notes available", tm: "1d ago", tp: "coach" },
  { t: "Follow-up overdue", s: "Riverside Golf Club — 2 days late", tm: "2d ago", tp: "overdue" },
];

// Transcript for call library
export const TRANSCRIPT = [
  { t: "00:02", sp: "Agent", tx: "Hi, I'm Alex with BYRDGANG — we make performance golf polos. Can I speak with whoever handles pro shop merchandise?" },
  { t: "00:08", sp: "Prospect", tx: "That would be Mike Thompson, he's our head pro. He's actually on the course right now." },
  { t: "00:14", sp: "Agent", tx: "No problem at all. Could I get his direct number so I can call back? Or is there a better time to reach him?" },
  { t: "00:20", sp: "Prospect", tx: "He's usually in before 9am. You can try the pro shop line directly — 801-555-0141." },
  { t: "00:26", sp: "Agent", tx: "Perfect, and just to confirm — Mike Thompson, head pro?" },
  { t: "00:30", sp: "Prospect", tx: "Yep, that's right." },
  { t: "00:32", sp: "Agent", tx: "Great, I'll give him a call in the morning. Thanks for your help!" },
];
