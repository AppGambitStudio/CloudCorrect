"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Plus, CheckCircle2, XCircle, Play, Settings, History, RotateCw, ExternalLink, Pause, PlayCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function GroupsPage() {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState<string | null>(null);

    const [newGroup, setNewGroup] = useState({
        name: '',
        description: '',
        awsAccountId: '',
        intervalMinutes: 5,
        notificationEmails: '',
    });

    useEffect(() => {
        if (user) {
            fetchGroups();
            fetchAccounts();
        }
    }, [user]);

    const fetchGroups = async () => {
        try {
            const response = await api.get(`/invariant-groups/${user?.tenantId}`);
            setGroups(response.data);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get(`/aws-accounts/${user?.tenantId}`);
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/invariant-groups', {
                ...newGroup,
                tenantId: user?.tenantId,
                enabled: true,
            });
            setIsCreateOpen(false);
            fetchGroups();
            setNewGroup({ name: '', description: '', awsAccountId: '', intervalMinutes: 5, notificationEmails: '' });
            toast.success('Invariant group created');
        } catch (error) {
            toast.error('Failed to create group');
        }
    };

    const handleToggleEnabled = async (groupId: string) => {
        try {
            await api.patch(`/invariant-groups/${groupId}/toggle`);
            fetchGroups();
            toast.success('Monitoring status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleEvaluate = async (groupId: string) => {
        setIsEvaluating(groupId);
        const tid = toast.loading('Running manual evaluation...');
        try {
            await api.post(`/invariant-groups/${groupId}/evaluate`);
            toast.success('Evaluation complete', { id: tid });
            fetchGroups();
        } catch (error) {
            toast.error('Evaluation failed', { id: tid });
        } finally {
            setIsEvaluating(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invariant Groups</h1>
                    <p className="text-slate-500 text-sm mt-1">Continuous validation of architectural correctness</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-lg shadow-sm font-semibold transition-all hover:scale-105 active:scale-95">
                            <Plus size={18} className="mr-2" />
                            New Group
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Create Invariant Group</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateGroup} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="group-name" className="text-sm font-black uppercase text-slate-400">Name</Label>
                                <Input
                                    id="group-name"
                                    className="h-12 rounded-xl border-slate-200"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    placeholder="Production Core API"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="desc" className="text-sm font-black uppercase text-slate-400">Description</Label>
                                <Input
                                    id="desc"
                                    className="h-12 rounded-xl border-slate-200"
                                    value={newGroup.description}
                                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                    placeholder="Checks for DNS, Load Balancing and IAM"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-black uppercase text-slate-400">AWS Environment</Label>
                                <Select
                                    value={newGroup.awsAccountId}
                                    onValueChange={(val) => setNewGroup({ ...newGroup, awsAccountId: val })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                        <SelectValue placeholder="Select account..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((acc: any) => (
                                            <SelectItem key={acc.id} value={acc.id} className="rounded-lg">
                                                {acc.name} ({acc.awsAccountId})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="interval" className="text-sm font-black uppercase text-slate-400">CHeck Interval (minutes)</Label>
                                <Input
                                    id="interval"
                                    type="number"
                                    className="h-12 rounded-xl border-slate-200"
                                    value={newGroup.intervalMinutes}
                                    onChange={(e) => setNewGroup({ ...newGroup, intervalMinutes: parseInt(e.target.value) })}
                                    min={1}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notificationEmails" className="text-sm font-black uppercase text-slate-400">Notification Emails</Label>
                                <Input
                                    id="notificationEmails"
                                    placeholder="admin@example.com, devops@example.com"
                                    className="h-12 rounded-xl border-slate-200"
                                    value={newGroup.notificationEmails}
                                    onChange={(e) => setNewGroup({ ...newGroup, notificationEmails: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400">Comma separated list of emails to notify on failure.</p>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full bg-blue-600 h-12 rounded-xl font-bold shadow-lg shadow-blue-100" disabled={!newGroup.awsAccountId}>
                                    Initialize Invariant Group
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {groups.map((group: any) => (
                    <Card key={group.id} className="bg-white hover:shadow-2xl transition-all duration-300 border-slate-200 group rounded-3xl overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-6 px-6">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{group.name}</CardTitle>
                                <CardDescription className="text-sm font-normal">{group.description || 'Continuous architectural audit active'}</CardDescription>
                            </div>
                            {group.enabled ? (
                                <Badge
                                    variant={group.lastStatus === 'PASS' ? 'default' : 'destructive'}
                                    className={`${group.lastStatus === 'PASS' ? 'bg-green-500' : 'bg-red-500'} h-6 px-2 rounded-full font-bold shadow-sm`}
                                >
                                    {group.lastStatus === 'PASS' ? <CheckCircle2 size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
                                    {group.lastStatus}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-slate-200 text-slate-500 h-6 px-2 rounded-full font-bold shadow-sm">
                                    <Pause size={12} className="mr-1" />
                                    PAUSED
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-0">
                            <div className="flex items-center space-x-4 text-[10px] text-slate-400 mb-6 font-bold uppercase tracking-wider">
                                <div className="flex items-center">
                                    <Play size={12} className="mr-1.5" />
                                    Every {group.intervalMinutes}m
                                </div>
                                <div className="flex items-center">
                                    <Settings size={12} className="mr-1.5" />
                                    {group.checks?.length || 0} assertions
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <Link href={`/groups/${group.id}`} className="flex-1">
                                    <Button
                                        variant="outline"
                                        className="w-full h-10 rounded-lg border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-600 hover:text-blue-700 font-semibold transition-all"
                                    >
                                        <ExternalLink size={16} className="mr-2" />
                                        View Dashboard
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-10 h-10 rounded-lg p-0 border-slate-200 transition-all",
                                        group.enabled ? "text-slate-400 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-green-600 hover:border-green-600 hover:bg-green-50"
                                    )}
                                    onClick={() => handleToggleEnabled(group.id)}
                                    title={group.enabled ? 'Pause Monitoring' : 'Resume Monitoring'}
                                >
                                    {group.enabled ? <Pause size={16} /> : <PlayCircle size={16} />}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-10 h-10 rounded-lg p-0 border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all"
                                    onClick={() => handleEvaluate(group.id)}
                                    disabled={isEvaluating === group.id || !group.enabled}
                                    title="Run Manual Evaluation"
                                >
                                    <RotateCw size={16} className={isEvaluating === group.id ? "animate-spin" : ""} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {groups.length === 0 && (
                    <Card className="col-span-full border-dashed border-2 p-24 text-center bg-slate-50/50 rounded-[40px] border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-slate-300 font-black text-3xl">No monitoring active</CardTitle>
                            <CardDescription className="text-lg font-medium text-slate-400 max-w-sm mx-auto mt-2">
                                Invariant groups allow you to define technical assertions that are checked continuously.
                            </CardDescription>
                            <div className="mt-8">
                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    variant="outline"
                                    className="rounded-xl h-12 border-slate-300 text-slate-500 font-bold px-8 hover:bg-white hover:text-blue-600 hover:border-blue-600 transition-all"
                                >
                                    Initialize First Group
                                </Button>
                            </div>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </div>
    );
}
