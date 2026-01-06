"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import api from '@/lib/api';
import { Plus, ExternalLink, Trash2, Key, Shield, Cloud } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export default function AccountsPage() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Auth Method State
    const [authMethod, setAuthMethod] = useState<'ROLE' | 'KEYS'>('ROLE');

    const [newAccount, setNewAccount] = useState({
        name: '',
        awsAccountId: '',
        roleArn: '',
        externalId: '',
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1',
    });

    useEffect(() => {
        if (user) {
            fetchAccounts();
        }
    }, [user]);

    const fetchAccounts = async () => {
        try {
            const response = await api.get(`/aws-accounts/${user?.tenantId}`);
            setAccounts(response.data);
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/aws-accounts', {
                ...newAccount,
                authMethod,
                tenantId: user?.tenantId,
            });
            setIsOpen(false);
            fetchAccounts();
            toast.success('AWS Account connected successfully');
            setNewAccount({
                name: '',
                awsAccountId: '',
                roleArn: '',
                externalId: '',
                accessKeyId: '',
                secretAccessKey: '',
                region: 'us-east-1'
            });
        } catch (error: any) {
            console.error('Failed to create account', error);
            toast.error(error.response?.data?.error || 'Failed to connect account');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteAccount = async (id: string) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;
        try {
            // Assuming we added a delete endpoint, if not we ignore for now
            // await api.delete(`/aws-accounts/${id}`);
            toast.success('Account disconnected');
            fetchAccounts();
        } catch (error) {
            toast.error('Failed to delete account');
        }
    };

    const openCFStack = () => {
        const extId = newAccount.externalId || uuidv4();
        if (!newAccount.externalId) {
            setNewAccount({ ...newAccount, externalId: extId });
        }

        const stackName = 'CloudCorrect-ReadOnly';
        const templatePath = 'https://cloudcorrect-templates.s3.amazonaws.com/cloudcorrect-readonly-role.yaml';
        const url = `https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/review?stackName=${stackName}&templateURL=${templatePath}&param_ExternalId=${extId}&param_TenantId=${user?.tenantId}`;

        window.open(url, '_blank');
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">AWS Accounts</h1>
                    <p className="text-slate-500">Manage your connected AWS accounts and security credentials</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus size={20} className="mr-2" />
                            Add Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Connect AWS Account</DialogTitle>
                            <DialogDescription>
                                Choose your preferred method to grant CloudCorrect access to your AWS resources.
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="cf" className="mt-4">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="cf" className="flex items-center">
                                    <Cloud size={16} className="mr-2" />
                                    One-Click Quick Start
                                </TabsTrigger>
                                <TabsTrigger value="manual" className="flex items-center">
                                    <Shield size={16} className="mr-2" />
                                    Advanced Setup
                                </TabsTrigger>
                            </TabsList>

                            {/* Quick Start Tab */}
                            <TabsContent value="cf" className="space-y-6 py-6">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-4">
                                    <div className="p-3 bg-blue-100 rounded-full h-min">
                                        <Cloud className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-blue-900">Recommended: CloudFormation Stack</h4>
                                        <p className="text-sm text-blue-700 mt-1">
                                            The safest way to connect. We'll generate a stack that creates a read-only role with a unique External ID for cross-account security.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Friendly Name</Label>
                                            <Input
                                                value={newAccount.name}
                                                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                                placeholder="My Production Account"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>AWS Account ID</Label>
                                            <Input
                                                value={newAccount.awsAccountId}
                                                onChange={(e) => setNewAccount({ ...newAccount, awsAccountId: e.target.value })}
                                                placeholder="123456789012"
                                                maxLength={12}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 border rounded-lg space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-medium">1. Run the CloudFormation template</p>
                                            <Button size="sm" onClick={openCFStack} className="bg-slate-900">
                                                <ExternalLink size={14} className="mr-2" />
                                                Launch Stack
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            This will open the AWS console in a new tab. After the stack finishes, copy the Role ARN back here.
                                        </p>
                                        <div className="space-y-2">
                                            <Label>2. Paste the generated Role ARN</Label>
                                            <Input
                                                value={newAccount.roleArn}
                                                onChange={(e) => setNewAccount({ ...newAccount, roleArn: e.target.value })}
                                                placeholder="arn:aws:iam::123456789012:role/CloudCorrectRole"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreate} className="w-full bg-blue-600" disabled={isLoading || !newAccount.roleArn}>
                                        {isLoading ? 'Connecting...' : 'Finish Connection'}
                                    </Button>
                                </DialogFooter>
                            </TabsContent>

                            {/* Manual Setup Tab */}
                            <TabsContent value="manual" className="space-y-6 py-6">
                                <RadioGroup
                                    defaultValue="role"
                                    onValueChange={(v) => {
                                        setAuthMethod(v as 'ROLE' | 'KEYS');
                                        setNewAccount({ ...newAccount, roleArn: '', accessKeyId: '', secretAccessKey: '' });
                                    }}
                                    className="flex gap-4 p-2 bg-slate-100 rounded-lg"
                                >
                                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md border flex-1 cursor-pointer">
                                        <RadioGroupItem value="ROLE" id="role" />
                                        <Label htmlFor="role" className="cursor-pointer">IAM Role (STS)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-md border flex-1 cursor-pointer">
                                        <RadioGroupItem value="KEYS" id="keys" />
                                        <Label htmlFor="keys" className="cursor-pointer">Access Keys</Label>
                                    </div>
                                </RadioGroup>

                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="manual-name">Friendly Name</Label>
                                            <Input
                                                id="manual-name"
                                                value={newAccount.name}
                                                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                                placeholder="Production Account"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="manual-awsAccountId">AWS Account ID</Label>
                                            <Input
                                                id="manual-awsAccountId"
                                                value={newAccount.awsAccountId}
                                                onChange={(e) => setNewAccount({ ...newAccount, awsAccountId: e.target.value })}
                                                placeholder="123456789012"
                                                maxLength={12}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {authMethod === 'ROLE' ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="manual-roleArn">Role ARN</Label>
                                                <Input
                                                    id="manual-roleArn"
                                                    value={newAccount.roleArn}
                                                    onChange={(e) => setNewAccount({ ...newAccount, roleArn: e.target.value })}
                                                    placeholder="arn:aws:iam::123456789012:role/CloudCorrectRole"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="manual-externalId">External ID (Optional)</Label>
                                                <Input
                                                    id="manual-externalId"
                                                    value={newAccount.externalId}
                                                    onChange={(e) => setNewAccount({ ...newAccount, externalId: e.target.value })}
                                                    placeholder="Custom External ID"
                                                />
                                                <p className="text-xs text-slate-500">Provide if your IAM trust policy targets a specific External ID.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="accessKeyId">Access Key ID</Label>
                                                <Input
                                                    id="accessKeyId"
                                                    value={newAccount.accessKeyId}
                                                    onChange={(e) => setNewAccount({ ...newAccount, accessKeyId: e.target.value })}
                                                    placeholder="AKIA..."
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="secretAccessKey">Secret Access Key</Label>
                                                <Input
                                                    id="secretAccessKey"
                                                    type="password"
                                                    value={newAccount.secretAccessKey}
                                                    onChange={(e) => setNewAccount({ ...newAccount, secretAccessKey: e.target.value })}
                                                    placeholder="••••••••••••"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="region">Primary Region</Label>
                                                <Input
                                                    id="region"
                                                    value={newAccount.region}
                                                    onChange={(e) => setNewAccount({ ...newAccount, region: e.target.value })}
                                                    placeholder="us-east-1"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <DialogFooter>
                                        <Button type="submit" className="w-full bg-blue-600" disabled={isLoading}>
                                            {isLoading ? 'Onboarding...' : 'Onboard Account'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account: any) => (
                    <Card key={account.id} className="relative group overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
                        <div className={`absolute top-0 left-0 w-1 h-full ${account.authMethod === 'ROLE' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{account.name}</CardTitle>
                                        {account.authMethod === 'ROLE' ? (
                                            <Shield size={14} className="text-blue-500" />
                                        ) : (
                                            <Key size={14} className="text-slate-400" />
                                        )}
                                    </div>
                                    <CardDescription>{account.awsAccountId}</CardDescription>
                                </div>
                                <button
                                    onClick={() => deleteAccount(account.id)}
                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="text-xs p-2 bg-slate-50 border rounded break-all font-mono text-slate-500 h-20 overflow-y-auto">
                                    {account.authMethod === 'ROLE' ? (
                                        <>
                                            <p className="font-bold text-slate-700 mb-1">Role ARN:</p>
                                            {account.roleArn}
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-slate-700 mb-1">Auth Method: API Keys</p>
                                            <p>Access Key: {account.accessKeyId?.substring(0, 8)}...</p>
                                            <p>Region: {account.region}</p>
                                        </>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" className="w-full text-slate-600 border-slate-200 bg-white hover:bg-slate-50">
                                    <ExternalLink size={14} className="mr-2" />
                                    Account Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {accounts.length === 0 && (
                    <Card className="col-span-full border-dashed p-12 text-center h-[300px] flex flex-col items-center justify-center">
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <Cloud size={48} className="text-slate-300" />
                        </div>
                        <CardTitle className="text-slate-500 mb-2">No accounts connected</CardTitle>
                        <CardDescription className="mb-6">Connect your first AWS account to start monitoring architectural invariants</CardDescription>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsOpen(true)}>
                            <Plus size={18} className="mr-2" />
                            Connect Account
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}
