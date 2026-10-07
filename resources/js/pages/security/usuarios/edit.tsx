import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

import { permissionGroupColors } from '@/components/security/permission-group-colors';
import { PermissionStatus, PermissionStatusBadge, TriStateCheckbox, TriStateLegend } from '@/components/security/usuarios/tri-state-permission';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import {
    ArrowLeft,
    CheckCircle2,
    KeyRound,
    Loader2,
    LockKeyhole,
    Mail,
    Minus,
    Plus,
    RotateCcw,
    Search,
    Shield,
    ShieldCheck,
    User,
    UserCog,
    Users,
    X,
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Role {
    id: number;
    name: string;
}

interface Permission {
    id: number;
    name: string;
}

interface Props {
    user: User;
    roles: Role[];
    permissions: Permission[];
    selectedRoles: number[];
    selectedPermissions: number[];
    deniedPermissions: number[];
}

interface UserForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: number[];
    permissions: number[];
    denied_permissions: number[];
    [key: string]: any;
}

type PermissionStatus = 'allow' | 'deny' | 'none';

export default function Edit({ user, roles, permissions, selectedRoles, selectedPermissions, deniedPermissions }: Props) {
    const [searchQuery, setSearchQuery] = useState('');

    const { data, setData, put, processing, errors } = useForm<UserForm>({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: selectedRoles ?? [],
        permissions: selectedPermissions ?? [],
        denied_permissions: deniedPermissions ?? [],
    });

    /*
    |--------------------------------------------------------------------------
    | Roles
    |--------------------------------------------------------------------------
    */

    const toggleRole = (roleId: number, checked: boolean) => {
        if (checked) {
            if (!data.roles.includes(roleId)) {
                setData('roles', [...data.roles, roleId]);
            }

            return;
        }

        setData(
            'roles',
            data.roles.filter((id) => id !== roleId),
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Permisos
    |--------------------------------------------------------------------------
    |
    | Cada permiso puede tener tres estados:
    |
    |   none  -> sin asignar (hereda rol o se niega por defecto)
    |   allow -> permitido explícitamente
    |   deny  -> denegado explícitamente (anula roles)
    |
    */

    const getPermissionStatus = (permissionId: number): PermissionStatus => {
        if (data.permissions.includes(permissionId)) {
            return 'allow';
        }

        if (data.denied_permissions.includes(permissionId)) {
            return 'deny';
        }

        return 'none';
    };

    const setPermissionStatus = (permissionId: number, status: PermissionStatus) => {
        const nextPermissions = data.permissions.filter((id) => id !== permissionId);
        const nextDeniedPermissions = data.denied_permissions.filter((id) => id !== permissionId);

        if (status === 'allow') {
            nextPermissions.push(permissionId);
        } else if (status === 'deny') {
            nextDeniedPermissions.push(permissionId);
        }

        setData({
            ...data,
            permissions: nextPermissions,
            denied_permissions: nextDeniedPermissions,
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Agrupar permisos
    |--------------------------------------------------------------------------
    */

    const groupedPermissions = useMemo(() => {
        return permissions.reduce(
            (groups, permission) => {
                const parts = permission.name.split('.');
                const group = parts[0] ?? permission.name;

                if (!groups[group]) {
                    groups[group] = [];
                }

                groups[group].push(permission);

                return groups;
            },
            {} as Record<string, Permission[]>,
        );
    }, [permissions]);

    const getPermissionName = (permissionName: string) => {
        const parts = permissionName.split('.');
        return parts.slice(1).join('.').replace(/_/g, ' ');
    };

    const filteredGroupedPermissions = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) {
            return groupedPermissions;
        }

        const filtered: Record<string, Permission[]> = {};
        for (const [group, perms] of Object.entries(groupedPermissions)) {
            const matches = perms.filter(
                (p) => p.name.toLowerCase().includes(q) || getPermissionName(p.name).toLowerCase().includes(q) || group.toLowerCase().includes(q),
            );
            if (matches.length > 0) {
                filtered[group] = matches;
            }
        }
        return filtered;
    }, [groupedPermissions, searchQuery]);

    /*
    |--------------------------------------------------------------------------
    | Acciones de grupo y globales
    |--------------------------------------------------------------------------
    */

    const setGroupStatus = (groupPermissions: Permission[], status: PermissionStatus) => {
        const groupIds = groupPermissions.map((permission) => permission.id);
        const nextPermissions = data.permissions.filter((id) => !groupIds.includes(id));
        const nextDenied = data.denied_permissions.filter((id) => !groupIds.includes(id));

        if (status === 'allow') {
            nextPermissions.push(...groupIds);
        } else if (status === 'deny') {
            nextDenied.push(...groupIds);
        }

        setData({
            ...data,
            permissions: nextPermissions,
            denied_permissions: nextDenied,
        });
    };

    const allowAll = () => {
        setData({
            ...data,
            permissions: permissions.map((p) => p.id),
            denied_permissions: [],
        });
    };

    const denyAll = () => {
        setData({
            ...data,
            permissions: [],
            denied_permissions: permissions.map((p) => p.id),
        });
    };

    const resetAll = () => {
        setData({
            ...data,
            permissions: [],
            denied_permissions: [],
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Guardar
    |--------------------------------------------------------------------------
    */

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(`/usuarios/${user.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Usuarios',
                    href: '/usuarios',
                },
                {
                    title: 'Editar usuario',
                    href: `/usuarios/${user.id}/edit`,
                },
            ]}
        >
            <Head title={`Editar ${user.name}`} />

            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
                <form onSubmit={submit} className="space-y-6">
                    {/* =====================================================
                        ENCABEZADO
                    ===================================================== */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
                                <UserCog className="text-primary size-5" />
                            </div>

                            <div className="min-w-0">
                                <h1 className="text-xl font-semibold tracking-tight">Editar usuario</h1>

                                <p className="text-muted-foreground mt-0.5 text-sm">Modifica los datos, roles y permisos del usuario.</p>
                            </div>
                        </div>

                        <Button type="button" variant="outline" asChild>
                            <Link href="/usuarios">
                                <ArrowLeft className="mr-2 size-4" />
                                Volver
                            </Link>
                        </Button>
                    </div>

                    {/* =====================================================
                        DATOS DEL USUARIO
                    ===================================================== */}

                    <Card>
                        <CardHeader className="bg-muted/20 space-y-4 border-b pb-4">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <UserCog className="text-primary size-5" />
                                    Datos del usuario
                                </CardTitle>

                                <CardDescription>Información básica de la cuenta.</CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                            {/* Nombre */}

                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>

                                <div className="relative">
                                    <User className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nombre completo"
                                        className="pl-9"
                                    />
                                </div>

                                {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                            </div>

                            {/* Email */}

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>

                                <div className="relative">
                                    <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="usuario@correo.com"
                                        className="pl-9"
                                    />
                                </div>

                                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                            </div>

                            {/* Nueva contraseña */}

                            <div className="space-y-2">
                                <Label htmlFor="password">Nueva contraseña</Label>

                                <div className="relative">
                                    <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Dejar vacío para mantener"
                                        className="pl-9"
                                    />
                                </div>

                                <p className="text-muted-foreground text-xs">Déjala vacía para conservar la contraseña actual.</p>

                                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                            </div>

                            {/* Confirmación */}

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar contraseña</Label>

                                <div className="relative">
                                    <LockKeyhole className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        ROLES
                    ===================================================== */}

                    <Card className="border shadow-xs">
                        <CardHeader className="bg-muted/20 space-y-4 border-b pb-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ShieldCheck className="text-primary size-5" />
                                        Roles
                                    </CardTitle>

                                    <CardDescription>
                                        Selecciona los roles que tendrá este usuario. Los roles proporcionan permisos base automáticamente.
                                    </CardDescription>
                                </div>

                                {roles.length > 0 && (
                                    <div className="bg-primary/10 text-primary inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
                                        <ShieldCheck className="size-3.5" />
                                        {data.roles.length} de {roles.length} {roles.length === 1 ? 'rol' : 'roles'}
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent>
                            {roles.length === 0 ? (
                                <div className="bg-muted/10 rounded-xl border border-dashed p-8 text-center">
                                    <Shield className="text-muted-foreground mx-auto mb-2 size-8 opacity-40" />
                                    <p className="text-muted-foreground text-sm">No hay roles disponibles.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {roles.map((role, index) => {
                                        const checked = data.roles.includes(role.id);
                                        const color = permissionGroupColors[index % permissionGroupColors.length];

                                        return (
                                            <label
                                                key={role.id}
                                                className={cn(
                                                    'group relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition-all duration-150 select-none',
                                                    checked
                                                        ? `shadow-xs ring-1 ${color.selected}`
                                                        : `border-border/60 ${color.card} hover:border-border/80`,
                                                )}
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${color.icon}`}>
                                                        <Shield className="size-4.5" />
                                                    </div>
                                                    <span className={cn('min-w-0 truncate text-sm font-medium', checked && 'font-semibold')}>
                                                        {role.name}
                                                    </span>
                                                </div>

                                                <Checkbox checked={checked} onCheckedChange={(value) => toggleRole(role.id, value === true)} />
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        PERMISOS DIRECTOS
                    ===================================================== */}

                    <Card className="border shadow-xs">
                        <CardHeader className="bg-muted/20 space-y-4 border-b pb-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Users className="text-primary size-5" />
                                        Permisos directos
                                    </CardTitle>

                                    <CardDescription>
                                        Asigna permisos específicos al usuario. Los permisos denegados (<strong>-</strong>) anulan lo que otorguen los
                                        roles.
                                    </CardDescription>
                                </div>

                                <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                                    {/* Contador de asignaciones */}
                                    <div className="bg-primary/10 text-primary inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
                                        <CheckCircle2 className="size-3.5" />
                                        {data.permissions.length + data.denied_permissions.length} de {permissions.length} asignados
                                    </div>

                                    {/* Buscador de permisos */}
                                    <div className="relative w-full sm:w-64">
                                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Buscar permiso o módulo..."
                                            className="h-9 rounded-lg pr-8 pl-9 text-xs"
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery('')}
                                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded p-0.5"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <TriStateLegend
                                allowedCount={data.permissions.length}
                                deniedCount={data.denied_permissions.length}
                                noneCount={Math.max(0, permissions.length - data.permissions.length - data.denied_permissions.length)}
                                onAllowAll={permissions.length > 0 ? allowAll : undefined}
                                onDenyAll={permissions.length > 0 ? denyAll : undefined}
                                onResetAll={data.permissions.length > 0 || data.denied_permissions.length > 0 ? resetAll : undefined}
                            />
                        </CardHeader>

                        <CardContent>
                            {Object.keys(filteredGroupedPermissions).length === 0 ? (
                                <div className="bg-muted/10 rounded-xl border border-dashed p-8 text-center">
                                    <Users className="text-muted-foreground mx-auto mb-2 size-8 opacity-40" />
                                    <p className="text-muted-foreground text-sm font-medium">
                                        {searchQuery ? `No se encontraron permisos para "${searchQuery}".` : 'No hay permisos disponibles.'}
                                    </p>
                                    {searchQuery && (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="mt-3 text-xs">
                                            Limpiar filtro
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(filteredGroupedPermissions).map(([group, groupPermissions], index) => {
                                        const color = permissionGroupColors[index % permissionGroupColors.length];
                                        const groupAllowedCount = groupPermissions.filter((p) => data.permissions.includes(p.id)).length;
                                        const groupDeniedCount = groupPermissions.filter((p) => data.denied_permissions.includes(p.id)).length;

                                        return (
                                            <Card
                                                key={group}
                                                className="overflow-hidden border shadow-2xs transition-all duration-150 hover:shadow-xs"
                                            >
                                                <CardHeader className={`border-b px-4 py-3 ${color.card}`}>
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-md ${color.icon}`}>
                                                            <KeyRound className="size-3.5" />
                                                        </span>
                                                        <span
                                                            className="text-foreground min-w-0 flex-1 text-sm leading-snug font-bold tracking-wide uppercase"
                                                            title={group.replace(/_/g, ' ')}
                                                        >
                                                            {group.replace(/_/g, ' ')}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-muted-foreground border-border/60 h-4.5 shrink-0 px-1.5 text-[11px] font-semibold"
                                                        >
                                                            {groupPermissions.length}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5">
                                                            {groupAllowedCount > 0 && (
                                                                <span className="py-0.2 inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                                                                    +{groupAllowedCount} permitido{groupAllowedCount > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            {groupDeniedCount > 0 && (
                                                                <span className="py-0.2 inline-flex items-center gap-0.5 rounded-md bg-rose-500/15 px-1.5 text-[10px] font-semibold text-rose-800 dark:text-rose-300">
                                                                    -{groupDeniedCount} denegado{groupDeniedCount > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex shrink-0 items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-1.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400"
                                                                onClick={() => setGroupStatus(groupPermissions, 'allow')}
                                                                title="Permitir todos (+)"
                                                            >
                                                                <Plus className="size-3 stroke-[3]" />
                                                                <span className="ml-0.5 hidden sm:inline">Todos</span>
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-1.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-500/10 hover:text-rose-800 dark:text-rose-400"
                                                                onClick={() => setGroupStatus(groupPermissions, 'deny')}
                                                                title="Denegar todos (-)"
                                                            >
                                                                <Minus className="size-3 stroke-[3]" />
                                                                <span className="ml-0.5 hidden sm:inline">Todos</span>
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                                                                onClick={() => setGroupStatus(groupPermissions, 'none')}
                                                                title="Vaciar categoría"
                                                            >
                                                                <RotateCcw className="size-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="space-y-1.5 p-2.5">
                                                    {groupPermissions.map((permission) => {
                                                        const status = getPermissionStatus(permission.id);

                                                        return (
                                                            <div
                                                                key={permission.id}
                                                                onClick={() => {
                                                                    const next = status === 'none' ? 'allow' : status === 'allow' ? 'deny' : 'none';
                                                                    setPermissionStatus(permission.id, next);
                                                                }}
                                                                className={cn(
                                                                    'group/item flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-2 text-xs transition-all select-none',
                                                                    status === 'allow' &&
                                                                        'border-emerald-500/35 bg-emerald-500/5 text-emerald-950 hover:border-emerald-500/50 dark:bg-emerald-950/20 dark:text-emerald-100',
                                                                    status === 'deny' &&
                                                                        'border-rose-500/35 bg-rose-500/5 text-rose-950 hover:border-rose-500/50 dark:bg-rose-950/20 dark:text-rose-100',
                                                                    status === 'none' &&
                                                                        'border-border/60 bg-card hover:bg-muted/40 hover:border-border',
                                                                )}
                                                            >
                                                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                                    <TriStateCheckbox
                                                                        status={status}
                                                                        onChange={(next) => setPermissionStatus(permission.id, next)}
                                                                    />
                                                                    <span
                                                                        className={cn(
                                                                            'truncate font-medium capitalize',
                                                                            status === 'allow' &&
                                                                                'font-semibold text-emerald-900 dark:text-emerald-300',
                                                                            status === 'deny' &&
                                                                                'font-semibold text-rose-900 line-through decoration-rose-500/50 dark:text-rose-300',
                                                                            status === 'none' && 'text-foreground',
                                                                        )}
                                                                    >
                                                                        {getPermissionName(permission.name)}
                                                                    </span>
                                                                </div>

                                                                <PermissionStatusBadge status={status} />
                                                            </div>
                                                        );
                                                    })}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        RESUMEN / ACCIONES
                    ===================================================== */}

                    <Card className="bg-card/95 sticky bottom-4 z-10 border shadow-lg backdrop-blur-md">
                        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted-foreground font-medium">Configuración:</span>

                                <Badge variant="outline" className="gap-1 font-semibold">
                                    <Shield className="text-primary size-3" />
                                    {data.roles.length} {data.roles.length === 1 ? 'rol' : 'roles'}
                                </Badge>

                                <Badge
                                    variant="outline"
                                    className="gap-1 border-emerald-500/30 bg-emerald-500/5 font-semibold text-emerald-800 dark:text-emerald-300"
                                >
                                    <Plus className="size-3 stroke-[3]" />
                                    {data.permissions.length} permitidos
                                </Badge>

                                {data.denied_permissions.length > 0 && (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-rose-500/30 bg-rose-500/5 font-semibold text-rose-800 dark:text-rose-300"
                                    >
                                        <Minus className="size-3 stroke-[3]" />
                                        {data.denied_permissions.length} denegados
                                    </Badge>
                                )}
                            </div>

                            <div className="flex shrink-0 flex-col-reverse gap-2.5 sm:flex-row">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/usuarios">Cancelar</Link>
                                </Button>

                                <Button type="submit" disabled={processing} className="font-semibold shadow-xs">
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 size-4" />
                                            Guardar cambios
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
