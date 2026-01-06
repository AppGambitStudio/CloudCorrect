"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Cloud, ShieldCheck, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const items = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'AWS Accounts', href: '/accounts', icon: Cloud },
    { label: 'Invariant Groups', href: '/groups', icon: ShieldCheck },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    if (!user || pathname === '/' || pathname === '/login') return null;

    return (
        <div className="flex flex-col w-64 border-r bg-slate-50 min-h-screen">
            <div className="p-6">
                <div className="flex items-center space-x-2 text-blue-600">
                    <Cloud size={28} strokeWidth={2.5} />
                    <h1 className="text-xl font-bold">CloudCorrect</h1>
                </div>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {items.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                            pathname === item.href
                                ? "bg-blue-600 text-white"
                                : "text-slate-600 hover:bg-slate-200"
                        )}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-4 border-t space-y-4">
                <div className="px-3 py-2 bg-slate-100/50 rounded-lg">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Signed in as</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{user.email}</p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 p-3 w-full text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-semibold text-sm">Logout</span>
                </button>
                <div className="pt-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400">
                        &copy; 2026 <a href="https://appgambit.com" target="_blank" rel="noopener noreferrer">APPGAMBiT</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
