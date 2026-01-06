"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [groups, setGroups] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-blue-100 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-slate-100 rounded"></div>
      </div>
    </div>
  );

  if (!user) return null;

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
