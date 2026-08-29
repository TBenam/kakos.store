'use client';

import Link from 'next/link';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, actions }: AdminHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-black tracking-tighter uppercase leading-none">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[#444748] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function AdminTopBar() {
  return (
    <header className="md:hidden flex justify-between items-center px-4 h-14 bg-white border-b border-[#e3e2e2] fixed top-0 left-0 right-0 z-50">
      <h1 className="font-display text-xl font-bold text-black tracking-tighter uppercase">KAKOS</h1>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#444748]">Admin</span>
    </header>
  );
}
