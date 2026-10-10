const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const S = ({ d, ...rest }: { d: string }) => <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden {...P} {...rest}><path d={d} /></svg>
export const IconHome = () => <S d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
export const IconCheck = () => <S d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
export const IconFood = () => <S d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2 1-3 4-3 7s1 4 3 4" />
export const IconChart = () => <S d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6" />
export const IconMore = () => <S d="M5 12h.01M12 12h.01M19 12h.01" />
export const IconChevron = () => <S d="M9 6l6 6-6 6" />
export const IconPlus = () => <S d="M12 5v14M5 12h14" />
export const IconBack = () => <S d="M15 6l-6 6 6 6" />
