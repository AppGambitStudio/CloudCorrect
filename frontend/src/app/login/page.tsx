"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Cloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const { user, signup, login, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const router = useRouter();

    React.useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, tenantName);
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Authentication failed');
        }
    };

    if (loading || user) return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <div className="flex items-center space-x-2 text-blue-600 mb-8">
                <Cloud size={40} strokeWidth={2.5} />
                <span className="text-3xl font-black tracking-tight">CloudCorrect</span>
            </div>

            <Card className="w-[400px] shadow-2xl shadow-slate-200 border-slate-200/60 rounded-3xl overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8">
                    <CardTitle className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
                    <p className="text-slate-400 text-sm mt-1">
                        {isLogin ? 'Enter your credentials to access your audits' : 'Start tracking your architectural intent'}
                    </p>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">Email Address</label>
                            <Input
                                className="h-12 border-slate-200 rounded-xl"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-400">Password</label>
                            <Input
                                className="h-12 border-slate-200 rounded-xl"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-400">Tenant Name</label>
                                <Input
                                    className="h-12 border-slate-200 rounded-xl"
                                    type="text"
                                    value={tenantName}
                                    onChange={(e) => setTenantName(e.target.value)}
                                    placeholder="My Organization"
                                    required
                                />
                            </div>
                        )}
                        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all mt-4">
                            {isLogin ? 'Sign In' : 'Create My Account'}
                        </Button>

                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <p className="mt-8 text-xs font-medium text-slate-400">
                &copy; 2026 APPGAMBiT. Built for architectural integrity.
            </p>
        </div>
    );
}
