export type DialerPhase =
  | 'IDLE'
  | 'READY'
  | 'DIALING'
  | 'RINGING'
  | 'CONNECTED'
  | 'WRAP-UP'
  | 'PAUSED'
  | 'COMPLETE';

export type CallCourse = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  timezone?: string | null;
  main_phone?: string | null;
  pro_shop_phone?: string | null;
  buyer_direct_phone?: string | null;
  buyer_name?: string | null;
  buyer_title?: string | null;
  pipeline_stage?: string | null;
  total_attempts?: number | null;
  ivr_pro_shop_key?: string | null;
  ivr_notes?: string | null;
  ivr_direct_extension?: string | null;
  phone_dial_priority?: string | null;
};

export type QueueItem = {
  id: string;
  campaign_id: string;
  course_id: string;
  position?: number | null;
  priority?: number | null;
  status?: string | null;
  scheduled_at?: string | null;
  attempts?: number | null;
  course: CallCourse;
};

export type CampaignRecord = {
  id: string;
  name: string;
  pipeline_stage?: string | null;
  dialer_mode?: string | null;
  parallel_lines?: number | null;
  voicemail_drop_url?: string | null;
  caller_id_pool?: string[] | null;
};

export function normalizePhone(phone?: string | null) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
}

export function formatDisplayPhone(phone?: string | null) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone || '—';
}

export function getAreaCode(phone?: string | null) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1, 4);
  if (digits.length >= 10) return digits.slice(0, 3);
  return null;
}

export function getLocalTimeLabel(timezone?: string | null) {
  if (!timezone) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(new Date());
  } catch {
    return null;
  }
}

export function getPreferredPhone(course: CallCourse) {
  const priority = course.phone_dial_priority;
  const options = [
    { key: 'buyer_direct_phone', label: 'Buyer direct', value: course.buyer_direct_phone },
    { key: 'pro_shop_phone', label: 'Pro Shop', value: course.pro_shop_phone },
    { key: 'main_phone', label: 'Main', value: course.main_phone },
  ];

  if (priority) {
    const preferred = options.find((item) => item.key === priority && item.value);
    if (preferred) return preferred;
  }

  return options.find((item) => item.value) || { key: 'main_phone', label: 'Main', value: '' };
}
