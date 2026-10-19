// Small SVG icons used across the app
const base = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  
  export const IconPlus = () => (
    <svg {...base}><path d="M12 5v14M5 12h14" /></svg>
  );
  
  export const IconSearch = () => (
    <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
  );
  
  export const IconClose = () => (
    <svg {...base}><path d="M18 6 6 18M6 6l12 12" /></svg>
  );
  
  export const IconEdit = () => (
    <svg {...base} width="16" height="16"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
  );
  
  export const IconTrash = () => (
    <svg {...base} width="16" height="16"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></svg>
  );
  
  export const IconImage = () => (
    <svg {...base} width="28" height="28" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
  );
  
  export const IconChevronDown = () => (
    <svg {...base} width="16" height="16"><path d="m6 9 6 6 6-6" /></svg>
  );
  
  export const IconUser = () => (
    <svg {...base} width="16" height="16"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  );
  
  export const IconLogout = () => (
    <svg {...base} width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>
  );

  
export const IconChevronLeft = () => (
  <svg {...base}><path d="m15 18-6-6 6-6" /></svg>
);

export const IconChevronRight = () => (
  <svg {...base}><path d="m9 18 6-6-6-6" /></svg>
);


export const IconCart = () => (
  <svg {...base} width="20" height="20"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.7 12.4a1.5 1.5 0 0 0 1.5 1.1h8.6a1.5 1.5 0 0 0 1.5-1.1L21 7H6" /></svg>
);

export const IconMapPin = () => (
  <svg {...base} width="16" height="16"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
);

export const IconArrowLeft = () => (
  <svg {...base} width="16" height="16"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
);

export const IconCheck = () => (
  <svg {...base}><path d="M20 6 9 17l-5-5" /></svg>
);
