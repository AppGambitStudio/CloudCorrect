"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user, signup, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (user) {
      fetchGroups();
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

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <Card className="w-96 shadow-xl">
          <CardHeader>
            <CardTitle>{isLogin ? 'Login' : 'Create Account'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tenant Name</label>
                  <Input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="My Org"
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                {isLogin ? 'Login' : 'Get Started'}
              </Button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Architecture Invariants</h1>
        <p className="text-slate-500">Real-time status of your cloud architectural expectations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Passing</p>
                <h3 className="text-2xl font-bold text-green-600">
                  {groups.filter((g: any) => g.lastStatus === 'PASS').length}
                </h3>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShieldCheck className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Failing</p>
                <h3 className="text-2xl font-bold text-red-600">
                  {groups.filter((g: any) => g.lastStatus === 'FAIL').length}
                </h3>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <ShieldAlert className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending</p>
                <h3 className="text-2xl font-bold text-slate-600">
                  {groups.filter((g: any) => g.lastStatus === 'PENDING').length}
                </h3>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <Clock className="text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invariant Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Checks</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group: any) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    <Badge variant={group.lastStatus === 'PASS' ? 'default' : 'destructive'} className={group.lastStatus === 'PASS' ? 'bg-green-500' : ''}>
                      {group.lastStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{group.checks?.length || 0} checks</TableCell>
                  <TableCell>{group.lastEvaluatedAt ? new Date(group.lastEvaluatedAt).toLocaleString() : 'Never'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => fetchGroups()}>Refresh</Button>
                  </TableCell>
                </TableRow>
              ))}
              {groups.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No invariant groups found. Go to Invariant Groups to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
