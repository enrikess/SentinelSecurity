import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useMemo, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { can } from '@/lib/permissions';
import type { SecuritySession } from '@/types';

import {
    Clock,
    Globe,
    Laptop,
    LogOut,
    MonitorSmartphone,
    Search,
    Smartphone,
    Tablet,
    Users,
} from 'lucide-react';
import { toast } from 'sonner';

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface Props {
    mySessions?: SecuritySession[];
    allSessions?: SecuritySession[];
    canManageAll?: boolean;
    sessions?: SecuritySession[];
}

/*
|--------------------------------------------------------------------------
| Componente Principal
|--------------------------------------------------------------------------
*/

export default function Index({
    mySessions = [],
    allSessions = [],
    canManageAll = false,
    sessions,
}: Props) {
    const effectiveMySessions = mySessions.length > 0 ? mySessions : (sessions ?? []);
    const effectiveAllSessions = allSessions.length > 0 ? allSessions : effectiveMySessions;

    const [activeTab, setActiveTab] = useState<'all' | 'mine'>(
        canManageAll ? 'all' : 'mine'
    );
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        current_password: '',
    });

    const myOtherSessions = effectiveMySessions.filter((s) => !s.is_current);
    const canRevoke = can('sesiones.revocar');

    const uniqueUsersCount = useMemo(() => {
        const userIds = new Set(
            effectiveAllSessions
                .map((s) => s.user?.id ?? s.user_id)
                .filter(Boolean)
        );
        return userIds.size || (effectiveAllSessions.length > 0 ? 1 : 0);
    }, [effectiveAllSessions]);

    const filteredAllSessions = useMemo(() => {
        if (!search.trim()) {
            return effectiveAllSessions;
        }
        const term = search.toLowerCase();
        return effectiveAllSessions.filter((s) => {
            const userName = s.user?.name?.toLowerCase() ?? '';
            const userEmail = s.user?.email?.toLowerCase() ?? '';
            const ip = s.ip_address?.toLowerCase() ?? '';
            const browser = s.browser?.toLowerCase() ?? '';
            const platform = s.platform?.toLowerCase() ?? '';
            return (
                userName.includes(term) ||
                userEmail.includes(term) ||
                ip.includes(term) ||
                browser.includes(term) ||
                platform.includes(term)
            );
        });
    }, [effectiveAllSessions, search]);

    /*
    |--------------------------------------------------------------------------
    | Revocar una sola sesión
    |--------------------------------------------------------------------------
    */

    const handleRevoke = (session: SecuritySession) => {
        const targetLabel = session.user?.name
            ? `${session.browser} (${session.platform}) de ${session.user.name}`
            : `${session.browser} (${session.platform})`;

        const confirmed = window.confirm(
            `¿Deseas cerrar la sesión en ${targetLabel}?`
        );

        if (!confirmed) {
            return;
        }

        router.post(route('sesiones.revoke', session.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Sesión revocada', {
                    description: `Se cerró la sesión en ${session.browser}.`,
                });
            },
            onError: (requestErrors) => {
                toast.error(
                    requestErrors.revoke ?? 'No se pudo cerrar la sesión.'
                );
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Revocar todas mis demás sesiones
    |--------------------------------------------------------------------------
    */

    const handleRevokeAll: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('sesiones.revoke-all'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('current_password');
                setDialogOpen(false);
                toast.success('Sesiones cerradas', {
                    description: 'Se cerraron todas tus demás sesiones activas.',
                });
            },
            onError: (requestErrors) => {
                toast.error(
                    requestErrors.current_password ??
                        'No se pudieron cerrar las sesiones.'
                );
            },
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Sesiones',
                    href: '/sesiones',
                },
            ]}
        >
            <Head title="Sesiones Activas" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                <MonitorSmartphone className="size-5" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight">
                                Gestión de Sesiones
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {canManageAll
                                ? 'Monitorea todas las sesiones activas en el sistema y administra tus propios dispositivos conectados.'
                                : 'Administra y cierra tus sesiones activas en otros navegadores y dispositivos.'}
                        </p>
                    </div>

                    {/* Botón para cerrar mis otras sesiones */}
                    {canRevoke && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={myOtherSessions.length === 0}
                                    className="shrink-0"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Cerrar mis otras sesiones
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-md">
                                <form onSubmit={handleRevokeAll}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Cerrar mis otras sesiones
                                        </DialogTitle>
                                        <DialogDescription>
                                            Ingresa tu contraseña actual para confirmar el cierre de{' '}
                                            <strong>{myOtherSessions.length}</strong>{' '}
                                            {myOtherSessions.length === 1
                                                ? 'sesión en otro dispositivo'
                                                : 'sesiones en otros dispositivos'}
                                            . Tu sesión actual permanecerá activa.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current_password">
                                                Contraseña actual
                                            </Label>
                                            <Input
                                                id="current_password"
                                                type="password"
                                                autoComplete="current-password"
                                                placeholder="••••••••"
                                                value={data.current_password}
                                                onChange={(e) =>
                                                    setData('current_password', e.target.value)
                                                }
                                                disabled={processing}
                                                autoFocus
                                            />
                                            {errors.current_password && (
                                                <p className="text-xs text-destructive">
                                                    {errors.current_password}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                reset('current_password');
                                                setDialogOpen(false);
                                            }}
                                            disabled={processing}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing || !data.current_password}
                                        >
                                            {processing
                                                ? 'Cerrando sesiones...'
                                                : 'Confirmar y cerrar'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Tarjetas de Métricas */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Sesiones Activas
                            </CardTitle>
                            <Globe className="size-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {canManageAll ? effectiveAllSessions.length : effectiveMySessions.length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {canManageAll ? 'En todo el sistema' : 'En tu cuenta'}
                            </p>
                        </CardContent>
                    </Card>

                    {canManageAll && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Usuarios Conectados
                                </CardTitle>
                                <Users className="size-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {uniqueUsersCount}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Cuentas con sesión activa
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Mis Dispositivos
                            </CardTitle>
                            <Laptop className="size-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {effectiveMySessions.length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {myOtherSessions.length === 0
                                    ? 'Solo este dispositivo'
                                    : `${myOtherSessions.length} dispositivo(s) adicional(es)`}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs de Navegación si es Administrador */}
                {canManageAll ? (
                    <Card>
                        <CardHeader className="border-b pb-4">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                {/* Switcher de Pestañas */}
                                <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('all')}
                                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                            activeTab === 'all'
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Users className="size-4" />
                                        Todas las sesiones ({effectiveAllSessions.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('mine')}
                                        className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                            activeTab === 'mine'
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Laptop className="size-4" />
                                        Mis dispositivos ({effectiveMySessions.length})
                                    </button>
                                </div>

                                {/* Buscador cuando está en pestaña 'all' */}
                                {activeTab === 'all' && (
                                    <div className="relative w-full sm:w-72">
                                        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Buscar usuario, IP o navegador..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {activeTab === 'all' ? (
                                <SessionsTable
                                    sessions={filteredAllSessions}
                                    showUserColumn={true}
                                    canRevoke={canRevoke}
                                    onRevoke={handleRevoke}
                                    emptyMessage={
                                        search
                                            ? 'No se encontraron sesiones que coincidan con la búsqueda.'
                                            : 'No hay sesiones activas registradas.'
                                    }
                                />
                            ) : (
                                <SessionsTable
                                    sessions={effectiveMySessions}
                                    showUserColumn={false}
                                    canRevoke={canRevoke}
                                    onRevoke={handleRevoke}
                                    emptyMessage="No hay otras sesiones activas en tu cuenta."
                                />
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    /* Vista para usuario normal (solo sus dispositivos) */
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Dispositivos conectados a tu cuenta
                            </CardTitle>
                            <CardDescription>
                                Esta es la lista de navegadores y dispositivos donde has iniciado sesión recientemente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <SessionsTable
                                sessions={effectiveMySessions}
                                showUserColumn={false}
                                canRevoke={canRevoke}
                                onRevoke={handleRevoke}
                                emptyMessage="No hay otras sesiones activas."
                            />
                        </CardContent>
                    </Card>
                )}

            </div>
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Tabla de Sesiones
|--------------------------------------------------------------------------
*/

interface SessionsTableProps {
    sessions: SecuritySession[];
    showUserColumn: boolean;
    canRevoke: boolean;
    onRevoke: (session: SecuritySession) => void;
    emptyMessage: string;
}

function SessionsTable({
    sessions,
    showUserColumn,
    canRevoke,
    onRevoke,
    emptyMessage,
}: SessionsTableProps) {
    if (sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MonitorSmartphone className="mb-2 size-8 opacity-40" />
                <p className="text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        {showUserColumn && <TableHead>Usuario</TableHead>}
                        <TableHead>Dispositivo y Navegador</TableHead>
                        <TableHead>Dirección IP</TableHead>
                        <TableHead>Última Actividad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => (
                        <SessionRow
                            key={session.id}
                            session={session}
                            showUserColumn={showUserColumn}
                            canRevoke={canRevoke}
                            onRevoke={onRevoke}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Fila individual de sesión
|--------------------------------------------------------------------------
*/

interface SessionRowProps {
    session: SecuritySession;
    showUserColumn: boolean;
    canRevoke: boolean;
    onRevoke: (session: SecuritySession) => void;
}

function SessionRow({
    session,
    showUserColumn,
    canRevoke,
    onRevoke,
}: SessionRowProps) {
    const Icon = deviceIcon(session.device);
    const userInitials = session.user?.name
        ? session.user.name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'U';

    return (
        <TableRow className={session.is_current ? 'bg-primary/[0.03]' : undefined}>
            {/* Columna de Usuario si aplica */}
            {showUserColumn && (
                <TableCell>
                    <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium">
                                    {session.user?.name ?? `Usuario #${session.user_id}`}
                                </span>
                                {session.is_current && (
                                    <Badge
                                        variant="outline"
                                        className="h-4 px-1 text-[10px] font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                    >
                                        Tú
                                    </Badge>
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {session.user?.email ?? '-'}
                            </span>
                        </div>
                    </div>
                </TableCell>
            )}

            {/* Dispositivo y Navegador */}
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                    </div>
                    <div>
                        <p className="font-medium text-sm">
                            {session.browser}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {session.platform} · {session.device}
                        </p>
                    </div>
                </div>
            </TableCell>

            {/* IP */}
            <TableCell className="font-mono text-xs text-muted-foreground">
                {session.ip_address ?? '-'}
            </TableCell>

            {/* Última Actividad */}
            <TableCell>
                <p className="flex items-center gap-1.5 text-sm">
                    <Clock className="size-3.5 text-muted-foreground" />
                    {timeAgo(session.last_activity)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(session.last_activity)}
                </p>
            </TableCell>

            {/* Estado */}
            <TableCell>
                {session.is_current ? (
                    <Badge
                        variant="outline"
                        className="border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-600 dark:text-emerald-400"
                    >
                        Esta sesión
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                        Activa
                    </Badge>
                )}
            </TableCell>

            {/* Acciones */}
            <TableCell className="text-right">
                {!session.is_current && canRevoke && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onRevoke(session)}
                    >
                        <LogOut className="mr-1.5 size-3.5" />
                        Revocar
                    </Button>
                )}
            </TableCell>
        </TableRow>
    );
}

/*
|--------------------------------------------------------------------------
| Icono por tipo de dispositivo
|--------------------------------------------------------------------------
*/

function deviceIcon(device: string) {
    if (device === 'Móvil') {
        return Smartphone;
    }

    if (device === 'Tablet') {
        return Tablet;
    }

    return Laptop;
}

/*
|--------------------------------------------------------------------------
| Fechas
|--------------------------------------------------------------------------
*/

function timeAgo(value: string): string {
    const minutes = Math.round(
        (Date.now() - new Date(value).getTime()) / 60000
    );

    const formatter = new Intl.RelativeTimeFormat('es-PE', {
        numeric: 'auto',
    });

    if (minutes < 60) {
        return formatter.format(-minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);

    if (hours < 24) {
        return formatter.format(-hours, 'hour');
    }

    const days = Math.round(hours / 24);

    if (days < 30) {
        return formatter.format(-days, 'day');
    }

    return formatter.format(-Math.round(days / 30), 'month');
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}