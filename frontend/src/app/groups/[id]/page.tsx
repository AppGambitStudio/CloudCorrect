"use client";

import React, { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';
import {
    CheckCircle2,
    XCircle,
    Play,
    Settings,
    Trash2,
    Shield,
    Globe,
    Server,
    Activity,
    History,
    RotateCw,
    ChevronLeft,
    ChevronRight,
    Plus,
    Info,
    Clock,
    Edit2,
    Database,
    Zap,
    PlayCircle,
    Pause,
    Box,
    Layers,
    Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useConfirm } from '@/hooks/useConfirm';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const { user } = useAuth();
    const confirm = useConfirm();

    const [group, setGroup] = useState<any>(null);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>({ totalPages: 0, total: 0, page: 1, limit: 10 });
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Check Management State
    const [newCheck, setNewCheck] = useState({
        service: 'EC2' as 'EC2' | 'ALB' | 'Route53' | 'IAM' | 'S3' | 'NETWORK' | 'RDS' | 'ECS',
        type: 'INSTANCE_RUNNING',
        scope: 'REGIONAL' as 'REGIONAL' | 'GLOBAL',
        region: 'us-east-1',
        alias: '',
        parameters: {} as any,
    });
    const [editingCheckId, setEditingCheckId] = useState<string | null>(null);

    useEffect(() => {
        if (user && id) {
            fetchDetail();
            fetchHistory(1);
        }
    }, [user, id]);

    const fetchDetail = async () => {
        try {
            const response = await api.get(`/invariant-groups/detail/${id}`);
            setGroup(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch group detail', error);
            toast.error('Failed to load group details');
        }
    };

    const fetchHistory = async (page = 1) => {
        try {
            const response = await api.get(`/invariant-groups/${id}/history?page=${page}&limit=10`);

            // Resilience: Handle both old array format and new paginated object format
            if (Array.isArray(response.data)) {
                setHistoryData(response.data);
                setPagination({
                    total: response.data.length,
                    page: 1,
                    limit: response.data.length,
                    totalPages: 1
                });
            } else if (response.data && response.data.data) {
                setHistoryData(response.data.data || []);
                setPagination(response.data.pagination || { totalPages: 0, total: 0, page: 1, limit: 10 });
            }

            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to fetch history', error);
        }
    };

    const handleToggleEnabled = async () => {
        try {
            const response = await api.patch(`/invariant-groups/${id}/toggle`);
            setGroup(response.data);
            toast.success('Monitoring status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleEvaluate = async () => {
        if (!group?.enabled) return;
        setIsEvaluating(true);
        const tid = toast.loading('Running evaluation...');
        try {
            await api.post(`/invariant-groups/${id}/evaluate`);
            toast.success('Evaluation complete', { id: tid });
            fetchDetail();
            fetchHistory(1);
        } catch (error) {
            toast.error('Evaluation failed', { id: tid });
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleAddCheck = async () => {
        try {
            if (editingCheckId) {
                const response = await api.patch(`/invariant-groups/${id}/checks/${editingCheckId}`, newCheck);
                const updatedChecks = group.checks.map((c: any) => c.id === editingCheckId ? response.data : c);
                setGroup({ ...group, checks: updatedChecks });
                toast.success('Assertion updated successfully');
                setEditingCheckId(null);
            } else {
                const response = await api.post(`/invariant-groups/${id}/checks`, newCheck);
                setGroup({ ...group, checks: [...(group.checks || []), response.data] });
                toast.success('Assertion added successfully');
            }

            setNewCheck({
                service: 'EC2',
                type: 'INSTANCE_RUNNING',
                scope: 'REGIONAL',
                region: 'us-east-1',
                alias: '',
                parameters: {},
            });
            setIsDialogOpen(false);
        } catch (error) {
            toast.error('Failed to add check');
        }
    };

    const handleDeleteCheck = async (checkId: string) => {
        const confirmed = await confirm({
            title: 'Delete Assertion',
            message: 'Are you sure you want to delete this assertion? This will not affect previous evaluations.',
            confirmText: 'Delete',
            variant: 'destructive'
        });

        if (!confirmed) return;

        if (checkId === editingCheckId) {
            setEditingCheckId(null);
            setNewCheck({
                service: 'EC2',
                type: 'INSTANCE_RUNNING',
                scope: 'REGIONAL',
                region: 'us-east-1',
                alias: '',
                parameters: {},
            });
        }
        try {
            await api.delete(`/invariant-groups/${id}/checks/${checkId}`);
            setGroup({ ...group, checks: group.checks.filter((c: any) => c.id !== checkId) });
            toast.success('Assertion deleted');
        } catch (error) {
            toast.error('Failed to delete assertion');
        }
    };

    const handleEditCheck = (check: any) => {
        setEditingCheckId(check.id);
        setNewCheck({
            service: check.service,
            type: check.type,
            scope: check.scope,
            region: check.region || 'us-east-1',
            alias: check.alias || '',
            parameters: { ...check.parameters },
        });
        setIsDialogOpen(true);
    };

    const handleServiceChange = (service: string) => {
        let type = '';
        let scope: 'REGIONAL' | 'GLOBAL' = 'REGIONAL';
        switch (service) {
            case 'EC2': type = 'INSTANCE_RUNNING'; scope = 'REGIONAL'; break;
            case 'ALB': type = 'TARGET_GROUP_HEALTHY'; scope = 'REGIONAL'; break;
            case 'Route53': type = 'DNS_POINTS_TO'; scope = 'GLOBAL'; break;
            case 'IAM': type = 'ROLE_EXISTS'; scope = 'GLOBAL'; break;
            case 'S3': type = 'S3_LIFECYCLE_CONFIGURED'; scope = 'REGIONAL'; break;
            case 'NETWORK': type = 'HTTP_200'; scope = 'GLOBAL'; break;
            case 'RDS': type = 'RDS_INSTANCE_AVAILABLE'; scope = 'REGIONAL'; break;
            case 'ECS': type = 'ECS_SERVICE_RUNNING'; scope = 'REGIONAL'; break;
        }
        setNewCheck({ ...newCheck, service: service as any, type, scope, alias: '', parameters: {} });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen">
                <RotateCw className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!group) {
        return <div className="p-8 text-center">Group not found</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="mb-8">
                <Link href="/groups" className="flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
                    <ChevronLeft size={20} className="mr-1" />
                    Back to Groups
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{group.name}</h1>
                            {group.enabled ? (
                                <Badge
                                    variant={group.lastStatus === 'PASS' ? 'default' : 'destructive'}
                                    className={`text-xs font-bold ${group.lastStatus === 'PASS' ? 'bg-green-500' : 'bg-red-500'}`}
                                >
                                    {group.lastStatus}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-slate-200 text-slate-500 font-bold">
                                    PAUSED
                                </Badge>
                            )}
                        </div>
                        <p className="text-base text-slate-500">{group.description || 'Continuous architectural audit active'}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button
                            variant="outline"
                            className={cn(
                                "h-11 px-6 rounded-xl border-slate-200 shadow-sm font-semibold transition-all",
                                group.enabled ? "text-slate-600 hover:text-amber-600 hover:border-amber-600 hover:bg-amber-50" : "text-slate-600 hover:text-green-600 hover:border-green-600 hover:bg-green-50"
                            )}
                            onClick={handleToggleEnabled}
                        >
                            {group.enabled ? (
                                <>
                                    <Pause size={18} className="mr-2" />
                                    Pause Monitoring
                                </>
                            ) : (
                                <>
                                    <PlayCircle size={18} className="mr-2" />
                                    Resume Monitoring
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleEvaluate}
                            disabled={isEvaluating || !group.enabled}
                            className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl shadow-lg shadow-blue-100 font-bold tracking-tight transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <RotateCw size={18} className={`mr-2 ${isEvaluating ? 'animate-spin' : ''}`} />
                            {isEvaluating ? 'Evaluating...' : 'Run Audit Now'}
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="history" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-lg h-10">
                    <TabsTrigger value="history" className="rounded-md px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                        <History size={16} className="mr-2" />
                        Evaluation History
                    </TabsTrigger>
                    <TabsTrigger value="checks" className="rounded-md px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                        <Settings size={16} className="mr-2" />
                        Manage Checks ({group.checks?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="rounded-md px-6 h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                        <Bell size={16} className="mr-2" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {Array.isArray(historyData) && historyData.map((run: any) => (
                            <Card key={run.id} className="overflow-hidden border-slate-200">
                                <CardHeader className="bg-slate-50/50 flex flex-row items-center justify-between border-b px-6 py-4">
                                    <div className="flex items-center space-x-4">
                                        <Badge variant={run.status === 'PASS' ? 'default' : 'destructive'} className={run.status === 'PASS' ? 'bg-green-500' : ''}>
                                            {run.status}
                                        </Badge>
                                        <div className="font-medium text-slate-700 flex items-center">
                                            <Play size={14} className="mr-2 text-slate-400" />
                                            {new Date(run.evaluatedAt).toLocaleString(undefined, {
                                                dateStyle: 'medium',
                                                timeStyle: 'medium'
                                            })}
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-slate-400">{run.results?.length} assertions checked</span>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {run.results?.map((res: any) => (
                                            <div key={res.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-2 rounded-lg ${res.status === 'PASS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                            {res.check?.service === 'EC2' && <Server size={20} />}
                                                            {res.check?.service === 'ALB' && <Activity size={20} />}
                                                            {res.check?.service === 'Route53' && <Globe size={20} />}
                                                            {res.check?.service === 'IAM' && <Shield size={20} />}
                                                            {res.check?.service === 'S3' && <Database size={20} />}
                                                            {res.check?.service === 'NETWORK' && <Zap size={20} />}
                                                            {res.check?.service === 'RDS' && <Database size={20} />}
                                                            {res.check?.service === 'ECS' && <Layers size={20} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center space-x-2">
                                                                <h4 className="font-bold text-slate-900">{res.check?.type}</h4>
                                                                <Badge variant="outline" className="text-[10px] h-4 uppercase">{res.check?.service}</Badge>
                                                            </div>
                                                            <p className="text-sm text-slate-500">{res.reason}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-2">Technical Intent (Expected)</p>
                                                        <p className="text-sm font-mono text-slate-600 leading-relaxed font-semibold">{res.expected}</p>
                                                    </div>
                                                    <div className={`p-4 rounded-xl border shadow-sm ${res.status === 'PASS' ? 'bg-green-50/30 border-green-100/50' : 'bg-red-50/30 border-red-100/50'}`}>
                                                        <p className={`text-[10px] uppercase tracking-wider font-black mb-2 ${res.status === 'PASS' ? 'text-green-500' : 'text-red-500'}`}>Evidence (Observed)</p>
                                                        <p className={`text-sm font-mono leading-relaxed font-black ${res.status === 'PASS' ? 'text-green-900' : 'text-red-900'}`}>{res.observed}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {historyData.length === 0 && (
                            <Card className="border-dashed py-24 text-center bg-slate-50/30">
                                <History size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900">Initial history pending</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                    Historical evidence will appear here once the group is evaluated.
                                </p>
                            </Card>
                        )}

                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-sm text-slate-500">
                                    Showing page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{pagination.totalPages}</span>
                                    <span className="mx-2 font-light text-slate-300">|</span>
                                    Total <span className="font-bold text-slate-900">{pagination.total}</span> runs
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchHistory(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="h-9 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                    >
                                        <ChevronLeft size={16} className="mr-2" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchHistory(currentPage + 1)}
                                        disabled={currentPage === pagination.totalPages}
                                        className="h-9 px-4 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                    >
                                        Next
                                        <ChevronRight size={16} className="ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="checks" className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center">
                            Current Architectural Invariants
                            <Badge variant="secondary" className="ml-3 font-medium">{group.checks?.length || 0}</Badge>
                        </h3>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-slate-900 h-10 shadow-sm" onClick={() => {
                                    if (!isDialogOpen) {
                                        setEditingCheckId(null);
                                        setNewCheck({
                                            service: 'EC2',
                                            type: 'INSTANCE_RUNNING',
                                            scope: 'REGIONAL',
                                            region: 'us-east-1',
                                            alias: '',
                                            parameters: {},
                                        });
                                    }
                                }}>
                                    <Plus size={16} className="mr-2" />
                                    New Assertion
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle className="text-xl flex items-center">
                                        {editingCheckId ? <Edit2 size={20} className="mr-2 text-blue-600" /> : <Plus size={20} className="mr-2 text-blue-600" />}
                                        {editingCheckId ? 'Edit Assertion' : 'Add New Assertion'}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>AWS Service</Label>
                                        <Select
                                            value={newCheck.service}
                                            onValueChange={handleServiceChange}
                                            disabled={!!editingCheckId}
                                        >
                                            <SelectTrigger className="h-12 border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="EC2">EC2 Instances</SelectItem>
                                                <SelectItem value="ALB">Load Balancers (ALB)</SelectItem>
                                                <SelectItem value="Route53">Route 53 DNS</SelectItem>
                                                <SelectItem value="IAM">IAM Security</SelectItem>
                                                <SelectItem value="S3">S3 Storage</SelectItem>
                                                <SelectItem value="NETWORK">Network Health</SelectItem>
                                                <SelectItem value="RDS">RDS Database</SelectItem>
                                                <SelectItem value="ECS">ECS Container Service</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Assertion Type</Label>
                                        <Select
                                            value={newCheck.type}
                                            onValueChange={(val) => setNewCheck({ ...newCheck, type: val, parameters: {} })}
                                        >
                                            <SelectTrigger className="h-12 border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {newCheck.service === 'EC2' && (
                                                    <>
                                                        <SelectItem value="INSTANCE_RUNNING">Instance is Running</SelectItem>
                                                        <SelectItem value="INSTANCE_HAS_PUBLIC_IP">Instance has Public IP</SelectItem>
                                                        <SelectItem value="HAS_PUBLIC_IP">Has Public IP</SelectItem>
                                                        <SelectItem value="IN_SECURITY_GROUP">In Security Group</SelectItem>
                                                        <SelectItem value="IN_SUBNET">In Subnet</SelectItem>
                                                    </>
                                                )}
                                                {newCheck.service === 'ALB' && (
                                                    <>
                                                        <SelectItem value="TARGET_GROUP_HEALTHY">Target Group Healthy</SelectItem>
                                                        <SelectItem value="ALB_LISTENER_EXISTS">Listener Exists</SelectItem>
                                                    </>
                                                )}
                                                {newCheck.service === 'Route53' && (
                                                    <>
                                                        <SelectItem value="DNS_POINTS_TO">DNS Points To</SelectItem>
                                                        <SelectItem value="RECORD_EXISTS">Record Exists</SelectItem>
                                                        <SelectItem value="TTL_EQUALS">TTL Equals</SelectItem>
                                                    </>
                                                )}
                                                {newCheck.service === 'IAM' && (
                                                    <>
                                                        <SelectItem value="ROLE_EXISTS">Role Exists</SelectItem>
                                                        <SelectItem value="ROLE_HAS_POLICY">Role Has Policy</SelectItem>
                                                        <SelectItem value="POLICY_ATTACHED_TO_RESOURCE">Policy Attached to Resource</SelectItem>
                                                    </>
                                                )}
                                                {newCheck.service === 'S3' && (
                                                    <>
                                                        <SelectItem value="S3_BUCKET_EXISTS">Bucket Exists</SelectItem>
                                                        <SelectItem value="S3_BUCKET_POLICY_PRESENT">Policy Present</SelectItem>
                                                        <SelectItem value="S3_BUCKET_PUBLIC_ACCESS_BLOCKED">Public Access Blocked</SelectItem>
                                                        <SelectItem value="S3_LIFECYCLE_CONFIGURED">Lifecycle Configured</SelectItem>
                                                        <SelectItem value="S3_OBJECT_EXISTS">Object Exists</SelectItem>
                                                    </>
                                                )}
                                                {newCheck.service === 'NETWORK' && (
                                                    <>
                                                        <SelectItem value="HTTP_200">HTTP 200 OK</SelectItem>
                                                        <SelectItem value="HTTP_RESPONSE_CONTAINS">HTTP Response Contains</SelectItem>
                                                        <SelectItem value="PING">ICMP Ping</SelectItem>
                                                    </>
                                                )}
                                                {newCheck.service === 'RDS' && (
                                                    <>
                                                        <SelectItem value="RDS_INSTANCE_AVAILABLE">Instance Available</SelectItem>
                                                        <SelectItem value="RDS_IN_SUBNET_GROUP">In Subnet Group</SelectItem>
                                                        <SelectItem value="RDS_PUBLIC_ACCESS_DISABLED">Public Access Disabled</SelectItem>
                                                        <SelectItem value="RDS_ENCRYPTION_ENABLED">Encryption Enabled</SelectItem>
                                                    </>
                                                )}
                                                {newCheck.service === 'ECS' && (
                                                    <>
                                                        <SelectItem value="ECS_SERVICE_RUNNING">Running (Sufficient)</SelectItem>
                                                        <SelectItem value="ECS_SERVICE_RUNNING_COUNT_EQUALS_DESIRED">Running (Exact)</SelectItem>
                                                        <SelectItem value="ECS_TASK_DEFINITION_REVISION_ACTIVE">Task Def Revision Active</SelectItem>
                                                        <SelectItem value="ECS_SERVICE_ATTACHED_TO_ALB">Attached to ALB</SelectItem>
                                                        <SelectItem value="ECS_CLUSTER_ACTIVE">Cluster Active</SelectItem>
                                                    </>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Alias (Optional)</Label>
                                        <Input
                                            className="h-10 border-slate-200"
                                            placeholder="e.g. web-server"
                                            value={newCheck.alias}
                                            onChange={(e) => setNewCheck({ ...newCheck, alias: e.target.value })}
                                        />
                                        <p className="text-[10px] text-slate-400">Used for referencing in other checks</p>
                                    </div>

                                    {newCheck.scope === 'REGIONAL' && (
                                        <div className="space-y-2">
                                            <Label>Region</Label>
                                            <Input
                                                className="h-12 border-slate-200"
                                                value={newCheck.region}
                                                onChange={(e) => setNewCheck({ ...newCheck, region: e.target.value })}
                                                placeholder="us-east-1"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Label>Parameters</Label>
                                        {newCheck.service === 'EC2' ? (
                                            <div className="space-y-2">
                                                <Input
                                                    className="h-12 border-slate-200"
                                                    placeholder="Instance ID (i-xxx)"
                                                    value={newCheck.parameters.instanceId || ''}
                                                    onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, instanceId: e.target.value } })}
                                                />
                                                {newCheck.type === 'IN_SECURITY_GROUP' && (
                                                    <Input
                                                        className="h-12 border-slate-200"
                                                        placeholder="Security Group ID (sg-xxx)"
                                                        value={newCheck.parameters.securityGroupId || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, securityGroupId: e.target.value } })}
                                                    />
                                                )}
                                                {newCheck.type === 'IN_SUBNET' && (
                                                    <Input
                                                        className="h-12 border-slate-200"
                                                        placeholder="Subnet ID (subnet-xxx)"
                                                        value={newCheck.parameters.subnetId || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, subnetId: e.target.value } })}
                                                    />
                                                )}
                                            </div>
                                        ) : newCheck.service === 'ALB' ? (
                                            <div className="space-y-2">
                                                {newCheck.type === 'TARGET_GROUP_HEALTHY' ? (
                                                    <Input
                                                        className="h-12 border-slate-200"
                                                        placeholder="Target Group ARN"
                                                        value={newCheck.parameters.targetGroupArn || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, targetGroupArn: e.target.value } })}
                                                    />
                                                ) : (
                                                    <>
                                                        <Input
                                                            className="h-12 border-slate-200"
                                                            placeholder="Load Balancer ARN"
                                                            value={newCheck.parameters.loadBalancerArn || ''}
                                                            onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, loadBalancerArn: e.target.value } })}
                                                        />
                                                        <Input
                                                            className="h-12 border-slate-200"
                                                            placeholder="Listener Port (e.g. 443)"
                                                            value={newCheck.parameters.listenerPort || ''}
                                                            onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, listenerPort: e.target.value } })}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        ) : newCheck.service === 'Route53' ? (
                                            <div className="space-y-2">
                                                <Input
                                                    className="border-slate-200"
                                                    placeholder="Record Name (e.g. app.example.com)"
                                                    value={newCheck.parameters.recordName || ''}
                                                    onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, recordName: e.target.value } })}
                                                />
                                                {newCheck.type === 'DNS_POINTS_TO' && (
                                                    <Input
                                                        className="border-slate-200"
                                                        placeholder="Expected Value (e.g. {{alias.property}})"
                                                        value={newCheck.parameters.expectedValue || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, expectedValue: e.target.value } })}
                                                    />
                                                )}
                                                {newCheck.type === 'TTL_EQUALS' && (
                                                    <Input
                                                        className="border-slate-200"
                                                        placeholder="Expected TTL (e.g. 300)"
                                                        value={newCheck.parameters.expectedTtl || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, expectedTtl: e.target.value } })}
                                                    />
                                                )}
                                                <Input
                                                    className="border-slate-200"
                                                    placeholder="Hosted Zone ID"
                                                    value={newCheck.parameters.hostedZoneId || ''}
                                                    onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, hostedZoneId: e.target.value } })}
                                                />
                                            </div>
                                        ) : newCheck.service === 'IAM' ? (
                                            <div className="space-y-2">
                                                <Input
                                                    className="border-slate-200"
                                                    placeholder="Role Name"
                                                    value={newCheck.parameters.roleName || ''}
                                                    onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, roleName: e.target.value } })}
                                                />
                                                {(newCheck.type === 'ROLE_HAS_POLICY' || newCheck.type === 'POLICY_ATTACHED_TO_RESOURCE') && (
                                                    <Input
                                                        className="border-slate-200"
                                                        placeholder="Policy ARN"
                                                        value={newCheck.parameters.policyArn || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, policyArn: e.target.value } })}
                                                    />
                                                )}
                                            </div>
                                        ) : newCheck.service === 'S3' ? (
                                            <div className="space-y-2">
                                                <Input
                                                    className="h-12 border-slate-200"
                                                    placeholder="Bucket Name"
                                                    value={newCheck.parameters.bucketName || ''}
                                                    onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, bucketName: e.target.value } })}
                                                />
                                                {newCheck.type === 'S3_OBJECT_EXISTS' && (
                                                    <Input
                                                        className="h-12 border-slate-200"
                                                        placeholder="Object Key"
                                                        value={newCheck.parameters.objectKey || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, objectKey: e.target.value } })}
                                                    />
                                                )}
                                            </div>
                                        ) : newCheck.service === 'NETWORK' ? (
                                            <div className="space-y-2">
                                                <Input
                                                    className="h-12 border-slate-200"
                                                    placeholder={newCheck.type === 'PING' ? 'IP or Hostname' : 'Complete URL (https://...)'}
                                                    value={newCheck.parameters.target || newCheck.parameters.url || ''}
                                                    onChange={(e) => {
                                                        const field = newCheck.type === 'PING' ? 'target' : 'url';
                                                        setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, [field]: e.target.value } });
                                                    }}
                                                />
                                                {newCheck.type === 'HTTP_RESPONSE_CONTAINS' && (
                                                    <Input
                                                        className="h-12 border-slate-200"
                                                        placeholder="Expected substring in response"
                                                        value={newCheck.parameters.expectedSubstring || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, expectedSubstring: e.target.value } })}
                                                    />
                                                )}
                                            </div>
                                        ) : newCheck.service === 'RDS' ? (
                                            <div className="space-y-2">
                                                <Input
                                                    className="h-12 border-slate-200"
                                                    placeholder="DB Instance Identifier"
                                                    value={newCheck.parameters.dbInstanceIdentifier || ''}
                                                    onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, dbInstanceIdentifier: e.target.value } })}
                                                />
                                                {newCheck.type === 'RDS_IN_SUBNET_GROUP' && (
                                                    <Input
                                                        className="h-12 border-slate-200"
                                                        placeholder="Subnet Group Name"
                                                        value={newCheck.parameters.subnetGroupName || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, subnetGroupName: e.target.value } })}
                                                    />
                                                )}
                                            </div>
                                        ) : newCheck.service === 'ECS' ? (
                                            <div className="space-y-2">
                                                <Input
                                                    className="h-12 border-slate-200"
                                                    placeholder="Cluster Name"
                                                    value={newCheck.parameters.clusterName || ''}
                                                    onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, clusterName: e.target.value } })}
                                                />
                                                {newCheck.type !== 'ECS_CLUSTER_ACTIVE' && (
                                                    <Input
                                                        className="h-12 border-slate-200"
                                                        placeholder="Service Name"
                                                        value={newCheck.parameters.serviceName || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, serviceName: e.target.value } })}
                                                    />
                                                )}
                                                {newCheck.type === 'ECS_TASK_DEFINITION_REVISION_ACTIVE' && (
                                                    <Input
                                                        className="h-12 border-slate-200"
                                                        placeholder="Expected Task Definition (ARN or family:rev)"
                                                        value={newCheck.parameters.expectedTaskDefinition || ''}
                                                        onChange={(e) => setNewCheck({ ...newCheck, parameters: { ...newCheck.parameters, expectedTaskDefinition: e.target.value } })}
                                                    />
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                    {group.checks?.some((c: any) => c.alias) && (
                                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                            <div className="flex items-center text-[10px] font-black uppercase text-blue-400 mb-2">
                                                <Info size={12} className="mr-1" />
                                                Dynamic Placeholders
                                            </div>
                                            <div className="space-y-2">
                                                {group.checks.filter((c: any) => c.alias).map((c: any) => (
                                                    <div key={c.id} className="text-[11px]">
                                                        <span className="font-bold text-blue-700">{"{{"}{c.alias}{"}}"}</span>
                                                        <span className="text-blue-500">: </span>
                                                        <span className="text-slate-500 italic block mt-1">
                                                            {c.service === 'EC2' && 'publicIp, privateIp, instanceId, state, stateReason, instanceType, az, vpcId, subnetId'}
                                                            {c.service === 'ALB' && 'healthyCount, totalCount, targetGroupArn, listenerPort, protocol'}
                                                            {c.service === 'IAM' && 'arn, roleName, path, createDate'}
                                                            {c.service === 'S3' && 'bucketName, rulesCount, region'}
                                                            {c.service === 'NETWORK' && 'status, latency, url, contentType, server'}
                                                            {c.service === 'Route53' && 'values, type, ttl'}
                                                            {c.service === 'RDS' && 'dbInstanceIdentifier, state, publicAccess, encrypted, engine, instanceClass'}
                                                            {c.service === 'ECS' && (c.type === 'ECS_CLUSTER_ACTIVE' ? 'clusterName, status, services, tasks' : 'clusterName, serviceName, running, desired, status')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex space-x-2 pt-4">
                                        <Button onClick={handleAddCheck} className="flex-1 bg-slate-900 h-11 shadow-sm font-semibold">
                                            {editingCheckId ? 'Update Assertion' : 'Add Assertion'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-11 px-6"
                                            onClick={() => setIsDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {group.checks?.map((check: any) => (
                            <Card key={check.id} className="hover:shadow-md transition-shadow border-slate-200">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                                                {check.service === 'EC2' && <Server size={24} />}
                                                {check.service === 'ALB' && <Activity size={24} />}
                                                {check.service === 'Route53' && <Globe size={24} />}
                                                {check.service === 'IAM' && <Shield size={24} />}
                                                {check.service === 'S3' && <Database size={24} />}
                                                {check.service === 'NETWORK' && <Zap size={24} />}
                                                {check.service === 'RDS' && <Database size={24} className="text-blue-500" />}
                                                {check.service === 'ECS' && <Layers size={24} className="text-orange-500" />}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-900">{check.type}</h4>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-4 font-black">{check.service}</Badge>
                                                    {check.alias && <Badge className="bg-blue-100 text-blue-700 text-[10px] h-4 border-blue-200">Alias: {check.alias}</Badge>}
                                                    {check.scope === 'REGIONAL' && <Badge variant="secondary" className="text-[10px] h-4">{check.region}</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                                onClick={() => handleEditCheck(check)}
                                            >
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                onClick={() => handleDeleteCheck(check.id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center text-[10px] font-black uppercase text-slate-400 mb-3 space-x-1">
                                            <Info size={12} />
                                            <span>Configuration Parameters</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(check.parameters).map(([key, val]: any) => (
                                                <div key={key} className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm">
                                                    <span className="text-slate-400 font-medium mr-1">{key}:</span>
                                                    <span className="text-slate-700 font-mono font-bold">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {group.checks?.length === 0 && (
                            <div className="text-center py-24 border-2 border-dashed rounded-3xl bg-slate-50/30">
                                <Shield size={48} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-lg font-medium text-slate-400">No invariants defined yet</h3>
                                <p className="text-slate-400 max-w-xs mx-auto text-sm mt-1">
                                    Click the "New Assertion" button to add your first architectural assertion.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card className="border-slate-200 shadow-none">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
                                <Bell className="mr-2 text-blue-500" size={24} />
                                Email Notifications
                            </CardTitle>
                            <CardDescription>
                                Configure who receives alerts when architectural invariants fail.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="notificationEmails" className="text-sm font-bold text-slate-700">Recipient Emails</Label>
                                <Input
                                    id="notificationEmails"
                                    placeholder="admin@example.com, devops@example.com"
                                    className="h-12 border-slate-200 rounded-xl"
                                    value={group.notificationEmails || ''}
                                    onChange={(e) => setGroup({ ...group, notificationEmails: e.target.value })}
                                />
                                <p className="text-xs text-slate-400">
                                    Separate multiple email addresses with commas. An email will be sent for every failed evaluation cycle.
                                </p>
                            </div>
                            <Button
                                onClick={async () => {
                                    try {
                                        await api.patch(`/invariant-groups/${group.id}`, { notificationEmails: group.notificationEmails });
                                        toast.success('Notification settings saved');
                                    } catch (error) {
                                        toast.error('Failed to save settings');
                                    }
                                }}
                                className="bg-slate-900 h-11 px-8 rounded-xl font-bold shadow-sm"
                            >
                                Save Notification Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
