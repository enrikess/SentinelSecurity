import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ArrowLeft, Check, Shield, UserPlus, Users } from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface Permission {
    id: number;
    name: string;
}

interface Props {
    roles: Role[];
    permissions: Permission[];
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

export default function Create({ roles, permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm<UserForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [],
        permissions: [],
        denied_permissions: [],
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
    |
    | usuarios.listar
    | usuarios.crear
    | usuarios.editar
    |
    | El grupo será "usuarios".
    |
    */

    const groupedPermissions = permissions.reduce(
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

    /*
    |--------------------------------------------------------------------------
    | Nombre amigable del permiso
    |--------------------------------------------------------------------------
    */

    const getPermissionName = (permissionName: string) => {
        const parts = permissionName.split('.');

        return parts.slice(1).join('.').replace(/_/g, ' ');
    };

    /*
    |--------------------------------------------------------------------------
    | Seleccionar todos los permisos del grupo
    |--------------------------------------------------------------------------
    */

    const toggleGroup = (groupPermissions: Permission[], checked: boolean) => {
        const permissionIds = groupPermissions.map((permission) => permission.id);

        if (checked) {
            setData({
                ...data,
                permissions: Array.from(new Set([...data.permissions, ...permissionIds])),
                // Al marcar "Todo" se quita el deny del grupo.
                denied_permissions: data.denied_permissions.filter((id) => !permissionIds.includes(id)),
            });

            return;
        }

        setData({
            ...data,
            permissions: data.permissions.filter((id) => !permissionIds.includes(id)),
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Estado del grupo
    |--------------------------------------------------------------------------
    */

    const isGroupChecked = (groupPermissions: Permission[]) => {
        if (groupPermissions.length === 0) {
            return false;
        }

        return groupPermissions.every((permission) => data.permissions.includes(permission.id));
    };

    /*
    |--------------------------------------------------------------------------
    | Enviar formulario
    |--------------------------------------------------------------------------
    */

    const submit = (e: FormEvent) => {
        e.preventDefault();

        post('/usuarios');
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Usuarios',
                    href: '/usuarios',
                },
                {
                    title: 'Crear usuario',
                    href: '/usuarios/create',
                },
            ]}
        >
            <Head title="Crear usuario" />

            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
                <form onSubmit={submit} className="space-y-6">
                    {/* =====================================================
                        ENCABEZADO
                    ===================================================== */}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Crear usuario</h1>

                            <p className="text-muted-foreground text-sm">Registra un usuario y configura sus roles y permisos.</p>
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
                                <UserPlus className="size-5" />
                                Datos del usuario
                            </CardTitle>

                            <CardDescription>Información básica para acceder al sistema.</CardDescription>
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

                            {/* Password */}

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>

                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="size-5" />
                                Roles
                            </CardTitle>

                            <CardDescription>
                                Selecciona los roles que tendrá este usuario. Los roles pueden proporcionar permisos automáticamente.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {roles.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center">
                                    <Shield className="text-muted-foreground mx-auto mb-2 size-8" />

                                    <p className="text-muted-foreground text-sm">No hay roles disponibles.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {roles.map((role) => {
                                        const checked = data.roles.includes(role.id);

                                        return (
                                            <label
                                                key={role.id}
                                                className={`hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                                                    checked ? 'border-primary bg-primary/5' : ''
                                                } `}
                                            >
                                                <Checkbox checked={checked} onCheckedChange={(value) => toggleRole(role.id, value === true)} />

                                                <span className="text-sm font-medium">{role.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* =====================================================
                        PERMISOS
                    ===================================================== */}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="size-5" />
                                Permisos directos
                            </CardTitle>

                            <CardDescription>
                                Asigna permisos directamente al usuario. Los permisos denegados anulan lo que otorgan los roles.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            {Object.keys(groupedPermissions).length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center">
                                    <p className="text-muted-foreground text-sm">No hay permisos disponibles.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(groupedPermissions).map(([group, groupPermissions]) => {
                                        const checked = isGroupChecked(groupPermissions);

                                        return (
                                            <Card key={group} className={`shadow-none transition ${checked ? 'border-primary/50' : ''} `}>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <CardTitle className="truncate text-base capitalize">
                                                                {group.replace(/_/g, ' ')}
                                                            </CardTitle>

                                                            <CardDescription className="text-xs">{groupPermissions.length} permisos</CardDescription>
                                                        </div>

                                                        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-medium">
                                                            <Checkbox
                                                                checked={checked}
                                                                onCheckedChange={(value) => toggleGroup(groupPermissions, value === true)}
                                                            />
                                                            Todo
                                                        </label>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="space-y-1">
                                                    {groupPermissions.map((permission) => {
                                                        const status = getPermissionStatus(permission.id);

                                                        return (
                                                            <div
                                                                key={permission.id}
                                                                className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-md px-3 py-2 transition"
                                                            >
                                                                <span className="text-sm capitalize">{getPermissionName(permission.name)}</span>

                                                                <Select
                                                                    value={status}
                                                                    onValueChange={(value) =>
                                                                        setPermissionStatus(permission.id, value as PermissionStatus)
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-8 w-32">
                                                                        <SelectValue />
                                                                    </SelectTrigger>

                                                                    <SelectContent>
                                                                        <SelectItem value="none">Sin asignar</SelectItem>

                                                                        <SelectItem value="allow">Permitir</SelectItem>

                                                                        <SelectItem value="deny" className="text-destructive">
                                                                            Denegar
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
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
                        RESUMEN
                    ===================================================== */}

                    <Card>
                        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-muted-foreground text-sm">
                                <span className="text-foreground font-medium">{data.roles.length}</span> {data.roles.length === 1 ? 'rol' : 'roles'}{' '}
                                seleccionado
                                {data.roles.length === 1 ? '' : 's'}
                                {' · '}
                                <span className="text-foreground font-medium">{data.permissions.length}</span>{' '}
                                {data.permissions.length === 1 ? 'permiso' : 'permisos'} permitido
                                {data.permissions.length === 1 ? '' : 's'}
                                {data.denied_permissions.length > 0 && (
                                    <>
                                        {' · '}
                                        <span className="text-destructive font-medium">{data.denied_permissions.length}</span>{' '}
                                        {data.denied_permissions.length === 1 ? 'permiso' : 'permisos'} denegado
                                        {data.denied_permissions.length === 1 ? '' : 's'}
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/usuarios">Cancelar</Link>
                                </Button>

                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        'Guardando...'
                                    ) : (
                                        <>
                                            <Check className="mr-2 size-4" />
                                            Crear usuario
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
