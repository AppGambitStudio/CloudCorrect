"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  Cloud,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  Fingerprint,
  MapPin,
  Share2,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 italic-style">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 text-blue-600">
          <Cloud size={32} strokeWidth={2.5} />
          <span className="text-2xl font-black tracking-tight">CloudCorrect</span>
        </div>
        <div className="flex items-center space-x-6">
          {user ? (
            <Link href="/dashboard">
              <Button variant="ghost" className="text-sm font-semibold text-slate-600 hover:text-blue-600">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                Login
              </Link>
              <Link href="/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 pt-20 pb-32 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <Zap size={14} />
          <span>Architectural Ground Truth</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          Architecture Properties,<br />
          <span className="text-blue-600">Not Raw Properties.</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-medium max-w-2xl mx-auto mb-12 animate-in fade-in duration-1000 delay-300">
          CloudCorrect tracks your architectural intent, not just observability trivia.
          Stop monitoring ripples; start monitoring the structural path.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in duration-1000 delay-500">
          <Link href={user ? "/dashboard" : "/login"}>
            <Button size="lg" className="h-14 px-8 rounded-full text-lg bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200">
              {user ? 'Go to Dashboard' : 'Start Your Audit'} <ArrowRight className="ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-slate-400 font-medium italic">No agent installation required.</p>
        </div>
      </section>

      {/* Trivia vs Path Comparison */}
      <section className="px-8 py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-6">
                That's Architectural Path,<br />
                <span className="text-slate-400">not observability trivia.</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Most platforms drown you in metrics. We focus on the structural integrity of your system.
                If your DNS record is pointing to the wrong IP, 100% CPU uptime doesn't save you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <XCircle size={80} className="text-red-500" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-red-500 mb-4">We Avoided</h4>
                <ul className="space-y-3">
                  {['CPU Utilization', 'Memory Usage', 'Connection Count', 'IOPS Latency'].map(item => (
                    <li key={item} className="flex items-center text-sm font-bold text-slate-400 line-through decoration-red-200">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-200 relative overflow-hidden text-white group">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <CheckCircle2 size={80} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-200 mb-4">We Focused On</h4>
                <ul className="space-y-3">
                  {['Identity', 'Wiring', 'Placement', 'Associations'].map(item => (
                    <li key={item} className="flex items-center text-sm font-bold">
                      <ShieldCheck size={16} className="mr-2 text-blue-200" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Four Pillars */}
      <section className="px-8 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">The Structural Invariants</h2>
          <p className="text-slate-500 mt-4 text-lg">Four dimensions of architectural correctness.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              title: 'Identity',
              desc: 'Continuous proof of existence. Verifying that critical resources (Roles, Buckets, Domains) aren\'t just present, but tagged and typed correctly.',
              icon: Fingerprint,
              color: 'text-orange-500',
              bg: 'bg-orange-50'
            },
            {
              title: 'Wiring',
              desc: 'Verification of structural paths. Ensuring Route53 records point to valid ALBs, and ALBs have healthy targets in the expected VPC.',
              icon: LinkIcon,
              color: 'text-blue-500',
              bg: 'bg-blue-50'
            },
            {
              title: 'Placement',
              desc: 'Subnet, AZ and Security Group isolation. Validating that instances are in the right topology with the correct network boundaries.',
              icon: MapPin,
              color: 'text-green-500',
              bg: 'bg-green-50'
            },
            {
              title: 'Associations',
              desc: 'The relationship layer. Monitoring that IAM Policies are attached to resources, and S3 Lifecycle rules actually exist on critical buckets.',
              icon: Share2,
              color: 'text-purple-500',
              bg: 'bg-purple-50'
            }
          ].map((pillar, i) => (
            <div key={i} className="group p-8 rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300">
              <div className={`${pillar.bg} ${pillar.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <pillar.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{pillar.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example Code Section */}
      <section className="px-8 py-24 mb-32">
        <div className="max-w-4xl mx-auto p-1 bg-slate-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-10 blur-2xl group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={300} className="text-blue-400" />
          </div>
          <div className="p-12 border border-slate-800 rounded-[2.3rem] relative z-10">
            <h3 className="text-2xl font-bold text-white mb-8">Executable Architecture</h3>
            <div className="space-y-6">
              {[
                { label: 'Check DNS Alignment', status: 'PASS', code: 'DNS_POINTS_TO( alias="api-lb", target="{{backend-alb.dnsName}}" )' },
                { label: 'Verify Fleet Health', status: 'PASS', code: 'TARGET_GROUP_HEALTHY( targetGroupArn="{{main-tg.arn}}", minHealthy=2 )' },
                { label: 'Enforce Placement', status: 'FAIL', code: 'IN_SUBNET( instanceId="{{web-1.id}}", subnetId="subnet-0bc2..." )' }
              ].map((ex, i) => (
                <div key={i} className="flex items-center space-x-4 font-mono text-sm">
                  <span className={`w-12 text-[10px] font-black px-2 py-0.5 rounded text-center ${ex.status === 'PASS' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {ex.status}
                  </span>
                  <span className="text-slate-400 group-hover:text-slate-300 transition-colors uppercase text-[10px] font-black w-32">{ex.label}</span>
                  <span className="text-blue-400 flex-1 truncate">{ex.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-16 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2 text-slate-400 grayscale">
            <Cloud size={24} />
            <span className="font-bold">CloudCorrect</span>
          </div>
          <div className="flex items-center space-x-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600">Features</a>
            <a href="#" className="hover:text-blue-600">Docs</a>
            <a href="#" className="hover:text-blue-600">Enterprise</a>
          </div>
          <p className="text-xs font-medium text-slate-400">
            &copy; 2026 APPGAMBiT. Built for architectural integrity.
          </p>
        </div>
      </footer>
    </div>
  );
}
