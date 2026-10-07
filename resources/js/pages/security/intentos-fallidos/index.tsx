import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { can } from '@/lib/permissions';
import type { FailedLoginAttemptItem, FailedLoginLockStatus, FailedLoginMetrics, PaginatedData } from '@/types';

import {
    Activity, AlertTriangle, Clock, Globe, Laptop, Lock, RefreshCw, Search,
    ShieldAlert, ShieldCheck, Smartphone, Tablet, Trash2, Unlock, Users,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    attempts: PaginatedData<FailedLoginAttemptItem>;
    metrics: FailedLoginMetrics;
    filters: { search?: string; email?: string; ip?: string; date_from?: string; date_to?: string };
}

export default function FailedAttemptsIndex({ attempts, metrics, filters }: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    // Gestión de bloqueos
    const [lockEmail, setLockEmail] = useState('');
    const [lockStatus, setLockStatus] = useState<FailedLoginLockStatus | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [unlockingIp, setUnlockingIp] = useState<string | null>(null);

    const [isClearOpen, setIsClearOpen] = useState(false);
    const [clearDays, setClearDays] = useState('30');
    const [isClearing, setIsClearing] = useState(false);

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        router.get('/intentos-fallidos', {
            search: searchTerm || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleCheckLock: FormEventHandler = async (e) => {
        e.preventDefault();
        if (!lockEmail) return;
        setIsChecking(true);
        try {
            const params = new URLSearchParams({ email: lockEmail });
            const res = await fetch(`/intentos-fallidos/estado?${params.toString()}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) throw new Error('Request failed');
            const data: FailedLoginLockStatus = await res.json();
            setLockStatus(data);
        } catch {
            toast.error('No se pudo consultar el estado del bloqueo');
        } finally {
            setIsChecking(false);
        }
    };

    const handleUnlockIp = (ip: string) => {
        if (!lockStatus) return;
        setUnlockingIp(ip);
        router.post('/intentos-fallidos/desbloquear', { email: lockStatus.email, ip }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`IP ${ip} desbloqueada exitosamente`);
                // Refrescar el estado
                handleCheckLock({ preventDefault: () => { } } as any);
            },
            onError: () => toast.error('Ocurrió un error al intentar desbloquear'),
            onFinish: () => setUnlockingIp(null),
        });
    };

    const confirmClear = () => {
        setIsClearing(true);
        router.delete('/intentos-fallidos/limpiar', {
            data: { days: clearDays ? parseInt(clearDays, 10) : undefined },
            preserveScroll: true,
            onSuccess: () => { toast.success('Historial purgado correctamente'); setIsClearOpen(false); },
            onError: () => toast.error('Ocurrió un error al purgar el historial'),
            onFinish: () => setIsClearing(false),
        });
    };

    const getDeviceIcon = (device: string) => {
        if (device.toLowerCase() === 'móvil' || device.toLowerCase() === 'movil') return <Smartphone className="h-4 w-4 text-muted-foreground" />;
        if (device.toLowerCase() === 'tablet') return <Tablet className="h-4 w-4 text-muted-foreground" />;
        return <Laptop className="h-4 w-4 text-muted-foreground" />;
    };

    const getStatusBadge = (isLocked: boolean) => {
        if (isLocked) return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200">Bloqueado</Badge>;
        return <Badge variant="outline" className="text-muted-foreground">Fallido</Badge>;
    };

    return (
        <AppLayout header={<h2 className="text-xl font-semibold tracking-tight text-foreground">Intentos Fallidos</h2>}>
            <Head title="Intentos Fallidos" />
            <div className="space-y-6">
                {/* METRICS */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total intentos</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_24h.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">En el historial</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Emails únicos</CardTitle>
                            <Lock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{metrics.unique_emails_24h.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Últimas 24h</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Últimas 24h</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{metrics.total_24h.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Intentos recientes</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Geografía</CardTitle>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.unique_ips_24h.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">IPs únicas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* PANEL DE GESTIÓN DE BLOQUEOS */}
                {can('intentos_fallidos.desbloquear') && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Unlock className="h-5 w-5" /> Gestión de bloqueos</CardTitle>
                            <CardDescription>Consulta el estado de un bloqueo activo y libéralo manualmente si es necesario.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCheckLock} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lock_email">Email del usuario</Label>
                                    <div className="flex gap-2">
                                        <Input id="lock_email" type="email" placeholder="usuario@ejemplo.com" value={lockEmail} onChange={(e) => setLockEmail(e.target.value)} disabled={isChecking} required />
                                        <Button type="submit" disabled={isChecking}>
                                            {isChecking ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">El sistema mostrará automáticamente todas las IPs asociadas.</p>
                                </div>
                            </form>

                            {lockStatus && (
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-lg border bg-muted/40 p-4">
                                        <div className="text-sm font-medium">{lockStatus.email}</div>
                                        <div className="text-xs text-muted-foreground">{lockStatus.total_attempts} intentos totales · {lockStatus.locked_count} bloqueadas</div>
                                    </div>
                                    {lockStatus.ips.length === 0 ? (
                                        <p className="py-6 text-center text-sm text-muted-foreground">No se encontraron intentos para este email.</p>
                                    ) : lockStatus.ips.map((ipInfo) => (
                                        <div key={ipInfo.ip} className="rounded-lg border p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-mono text-sm font-medium">{ipInfo.ip}</span>
                                                        {getStatusBadge(ipInfo.is_locked)}
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-xs">
                                                        <span><span className="text-muted-foreground">Intentos: </span>{ipInfo.attempts} / {ipInfo.max_attempts}</span>
                                                        {ipInfo.is_locked && <span><span className="text-muted-foreground">Disponible en: </span>{ipInfo.human_remaining || `${ipInfo.available_in}s`}</span>}
                                                        <span><span className="text-muted-foreground">Último: </span>{ipInfo.last_attempt_at ? new Date(ipInfo.last_attempt_at).toLocaleString('es') : '—'}</span>
                                                    </div>
                                                </div>
                                                {ipInfo.is_locked && <Button variant="destructive" size="sm" onClick={() => handleUnlockIp(ipInfo.ip)} disabled={unlockingIp === ipInfo.ip}>
                                                    {unlockingIp === ipInfo.ip ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Unlock className="mr-2 h-4 w-4" />Desbloquear</>}
                                                </Button>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* FILTERS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                        <CardDescription>Filtrar por criterios específicos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Buscar</Label>
                                    <Input id="search" placeholder="Email, IP, dispositivo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_from">Desde</Label>
                                    <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date_to">Hasta</Label>
                                    <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                {(searchTerm || dateFrom || dateTo) && (
                                    <Button variant="outline" type="button" onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); router.get('/intentos-fallidos', {}, { preserveState: true }); }}>
                                        Limpiar
                                    </Button>
                                )}
                                <Button type="submit">
                                    <Search className="mr-2 h-4 w-4" /> Filtrar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* TABLE */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Registro de intentos</CardTitle>
                                <CardDescription>Lista completa de intentos fallidos</CardDescription>
                            </div>
                            {can('intentos_fallidos.limpiar') && (
                                <Button variant="outline" size="sm" onClick={() => setIsClearOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Purgar historial
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Email</TableHead>
                                        <TableHead>IP</TableHead>
                                        <TableHead>Dispositivo</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attempts.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No hay registros</TableCell>
                                        </TableRow>
                                    ) : (
                                        attempts.data.map((attempt) => (
                                            <TableRow key={attempt.id}>
                                                <TableCell className="font-medium">{attempt.email}</TableCell>
                                                <TableCell className="font-mono text-xs">{attempt.ip_address}</TableCell>
                                                <TableCell>{getDeviceIcon(attempt.agent.device)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{attempt.reason}</TableCell>
                                                <TableCell>{getStatusBadge(attempt.is_locked)}</TableCell>
                                                <TableCell className="text-right text-sm text-muted-foreground">{attempt.created_at}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* PAGINATION */}
                {attempts.last_page > 1 && (
                    <div className="flex items-center justify-between border-t px-6 py-4">
                        <div className="text-sm text-muted-foreground">Mostrando {attempts.from} a {attempts.to} de {attempts.total}</div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={!attempts.prev_page_url} onClick={() => router.get(attempts.prev_page_url!, {}, { preserveState: true })}>Anterior</Button>
                            <Button variant="outline" size="sm" disabled={!attempts.next_page_url} onClick={() => router.get(attempts.next_page_url!, {}, { preserveState: true })}>Siguiente</Button>
                        </div>
                    </div>
                )}

                {/* DIALOGS */}

                <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Purgar historial</DialogTitle>
                            <DialogDescription>Eliminar registros antiguos de intentos fallidos.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="clear_days" className="text-sm font-medium">Días:</Label>
                            <Input id="clear_days" type="number" min="0" placeholder="Vacío = todo" value={clearDays} onChange={(e) => setClearDays(e.target.value)} disabled={isClearing} className="mt-2" />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsClearOpen(false)} disabled={isClearing}>Cancelar</Button>
                            <Button variant="destructive" onClick={confirmClear} disabled={isClearing}>{isClearing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}Purgar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
