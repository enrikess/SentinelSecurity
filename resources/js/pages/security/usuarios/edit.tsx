import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    PermissionStatus,
    PermissionStatusBadge,
    TriStateCheckbox,
    TriStateLegend,
} from '@/components/security/usuarios/tri-state-permission';
import { cn } from '@/lib/utils';

import {
    ArrowLeft,
    Check,
    CheckCircle2,
    FolderLock,
    KeyRound,
    Loader2,
    Minus,
    Plus,
    RotateCcw,
    Search,
    Shield,
    ShieldCheck,
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
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    getPermissionName(p.name).toLowerCase().includes(q) ||
                    group.toLowerCase().includes(q),
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
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Editar usuario</h1>

                            <p className="text-muted-foreground text-sm">Modifica los datos, roles y permisos del usuario.</p>
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
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCog className="size-5" />
                                Datos del usuario
                            </CardTitle>

                            <CardDescription>Información básica de la cuenta.</CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            {/* Nombre */}

                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre</Label>

                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Nombre completo" />

                                {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                            </div>

                            {/* Email */}

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="usuario@correo.com"
                                />

                                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                            </div>

                            {/* Nueva contraseña */}

                            <div className="space-y-2">
                                <Label htmlFor="password">Nueva contraseña</Label>

                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Dejar vacío para mantener"
                                />

                                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                            </div>

                            {/* Confirmación */}

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar contraseña</Label>

                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        ROLES
                    ===================================================== */}

                    <Card className="border shadow-xs">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ShieldCheck className="size-5 text-primary" />
                                    Roles
                                </CardTitle>
                                {data.roles.length > 0 && (
                                    <Badge variant="secondary" className="font-semibold">
                                        {data.roles.length} {data.roles.length === 1 ? 'rol asignado' : 'roles asignados'}
                                    </Badge>
                                )}
                            </div>

                            <CardDescription>
                                Selecciona los roles que tendrá este usuario. Los roles proporcionan permisos base automáticamente.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {roles.length === 0 ? (
                                <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10">
                                    <Shield className="text-muted-foreground mx-auto mb-2 size-8 opacity-40" />
                                    <p className="text-muted-foreground text-sm">No hay roles disponibles.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {roles.map((role) => {
                                        const checked = data.roles.includes(role.id);

                                        return (
                                            <label
                                                key={role.id}
                                                className={cn(
                                                    'group relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 transition-all select-none',
                                                    checked
                                                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                                                        : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border',
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div
                                                        className={cn(
                                                            'flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors',
                                                            checked
                                                                ? 'border-primary/40 bg-primary/10 text-primary'
                                                                : 'border-muted-foreground/20 bg-muted/40 text-muted-foreground group-hover:text-foreground',
                                                        )}
                                                    >
                                                        <Shield className="size-4" />
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'truncate text-sm font-medium',
                                                            checked && 'text-primary font-semibold',
                                                        )}
                                                    >
                                                        {role.name}
                                                    </span>
                                                </div>

                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(value) => toggleRole(role.id, value === true)}
                                                />
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
                        <CardHeader className="space-y-4 pb-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Users className="size-5 text-primary" />
                                        Permisos directos
                                    </CardTitle>

                                    <CardDescription>
                                        Asigna permisos específicos al usuario. Los permisos denegados (<strong>-</strong>) anulan lo que otorguen los roles.
                                    </CardDescription>
                                </div>

                                {/* Buscador de permisos */}
                                <div className="relative w-full sm:w-64 shrink-0">
                                    <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2 pointer-events-none" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar permiso o módulo..."
                                        className="h-9 pl-9 pr-8 text-xs rounded-lg"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="text-muted-foreground hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-pointer"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <TriStateLegend
                                allowedCount={data.permissions.length}
                                deniedCount={data.denied_permissions.length}
                                noneCount={Math.max(
                                    0,
                                    permissions.length - data.permissions.length - data.denied_permissions.length,
                                )}
                                onAllowAll={permissions.length > 0 ? allowAll : undefined}
                                onDenyAll={permissions.length > 0 ? denyAll : undefined}
                                onResetAll={
                                    data.permissions.length > 0 || data.denied_permissions.length > 0
                                        ? resetAll
                                        : undefined
                                }
                            />
                        </CardHeader>

                        <CardContent>
                            {Object.keys(filteredGroupedPermissions).length === 0 ? (
                                <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10">
                                    <Users className="text-muted-foreground mx-auto mb-2 size-8 opacity-40" />
                                    <p className="text-muted-foreground text-sm font-medium">
                                        {searchQuery
                                            ? `No se encontraron permisos para "${searchQuery}".`
                                            : 'No hay permisos disponibles.'}
                                    </p>
                                    {searchQuery && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSearchQuery('')}
                                            className="mt-3 text-xs"
                                        >
                                            Limpiar filtro
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(filteredGroupedPermissions).map(([group, groupPermissions]) => {
                                        const groupAllowedCount = groupPermissions.filter((p) =>
                                            data.permissions.includes(p.id),
                                        ).length;
                                        const groupDeniedCount = groupPermissions.filter((p) =>
                                            data.denied_permissions.includes(p.id),
                                        ).length;

                                        return (
                                            <Card
                                                key={group}
                                                className="shadow-2xs overflow-hidden border transition-all duration-150 hover:shadow-xs"
                                            >
                                                <CardHeader className="border-b bg-muted/30 px-3.5 py-2.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <KeyRound className="size-3.5 text-muted-foreground shrink-0" />
                                                            <span className="truncate text-xs font-bold tracking-tight text-foreground uppercase">
                                                                {group.replace(/_/g, ' ')}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="h-4 px-1.5 text-[10px] font-normal text-muted-foreground"
                                                            >
                                                                {groupPermissions.length}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-800"
                                                                onClick={() => setGroupStatus(groupPermissions, 'allow')}
                                                                title="Permitir todos (+)"
                                                            >
                                                                <Plus className="size-3 stroke-[3]" />
                                                                <span className="hidden sm:inline ml-0.5">Todos</span>
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-1.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-800"
                                                                onClick={() => setGroupStatus(groupPermissions, 'deny')}
                                                                title="Denegar todos (-)"
                                                            >
                                                                <Minus className="size-3 stroke-[3]" />
                                                                <span className="hidden sm:inline ml-0.5">Todos</span>
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                                onClick={() => setGroupStatus(groupPermissions, 'none')}
                                                                title="Vaciar categoría"
                                                            >
                                                                <RotateCcw className="size-3" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {(groupAllowedCount > 0 || groupDeniedCount > 0) && (
                                                        <div className="flex items-center gap-1.5 pt-1">
                                                            {groupAllowedCount > 0 && (
                                                                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                                                                    +{groupAllowedCount} permitido{groupAllowedCount > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                            {groupDeniedCount > 0 && (
                                                                <span className="inline-flex items-center gap-0.5 rounded-md bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-rose-800 dark:text-rose-300">
                                                                    -{groupDeniedCount} denegado{groupDeniedCount > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </CardHeader>

                                                <CardContent className="space-y-1.5 p-2.5">
                                                    {groupPermissions.map((permission) => {
                                                        const status = getPermissionStatus(permission.id);

                                                        return (
                                                            <div
                                                                key={permission.id}
                                                                onClick={() => {
                                                                    const next =
                                                                        status === 'none'
                                                                            ? 'allow'
                                                                            : status === 'allow'
                                                                              ? 'deny'
                                                                              : 'none';
                                                                    setPermissionStatus(permission.id, next);
                                                                }}
                                                                className={cn(
                                                                    'group/item flex items-center justify-between gap-2 rounded-lg border p-2 transition-all cursor-pointer select-none text-xs',
                                                                    status === 'allow' &&
                                                                        'border-emerald-500/35 bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100 hover:border-emerald-500/50',
                                                                    status === 'deny' &&
                                                                        'border-rose-500/35 bg-rose-500/5 dark:bg-rose-950/20 text-rose-950 dark:text-rose-100 hover:border-rose-500/50',
                                                                    status === 'none' &&
                                                                        'border-border/60 bg-card hover:bg-muted/40 hover:border-border',
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                                    <TriStateCheckbox
                                                                        status={status}
                                                                        onChange={(next) =>
                                                                            setPermissionStatus(permission.id, next)
                                                                        }
                                                                    />
                                                                    <span
                                                                        className={cn(
                                                                            'truncate capitalize font-medium',
                                                                            status === 'allow' &&
                                                                                'text-emerald-900 dark:text-emerald-300 font-semibold',
                                                                            status === 'deny' &&
                                                                                'text-rose-900 dark:text-rose-300 font-semibold line-through decoration-rose-500/50',
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

                    <Card className="sticky bottom-4 z-10 border shadow-lg bg-card/95 backdrop-blur-md">
                        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-muted-foreground font-medium">Configuración:</span>

                                <Badge variant="outline" className="font-semibold gap-1">
                                    <Shield className="size-3 text-primary" />
                                    {data.roles.length} {data.roles.length === 1 ? 'rol' : 'roles'}
                                </Badge>

                                <Badge
                                    variant="outline"
                                    className="font-semibold border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 gap-1"
                                >
                                    <Plus className="size-3 stroke-[3]" />
                                    {data.permissions.length} permitidos
                                </Badge>

                                {data.denied_permissions.length > 0 && (
                                    <Badge
                                        variant="outline"
                                        className="font-semibold border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-300 gap-1"
                                    >
                                        <Minus className="size-3 stroke-[3]" />
                                        {data.denied_permissions.length} denegados
                                    </Badge>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-2.5 sm:flex-row shrink-0">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/usuarios">Cancelar</Link>
                                </Button>

                                <Button type="submit" disabled={processing} className="shadow-xs font-semibold">
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
