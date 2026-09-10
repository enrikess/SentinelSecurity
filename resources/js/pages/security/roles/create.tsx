import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Save,
    ShieldCheck,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| Tipos
|--------------------------------------------------------------------------
*/

interface Permission {
    id: number;
    name: string;
    action: string;
}

interface PermissionGroup {
    name: string;
    permissions: Permission[];
}

interface Props {
    permissions: PermissionGroup[];
}

/*
|--------------------------------------------------------------------------
| Colores
|--------------------------------------------------------------------------
*/

const colors = [
    {
        card: 'bg-blue-50/60 dark:bg-blue-950/20',
        icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    },
    {
        card: 'bg-emerald-50/60 dark:bg-emerald-950/20',
        icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    },
    {
        card: 'bg-violet-50/60 dark:bg-violet-950/20',
        icon: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    },
    {
        card: 'bg-orange-50/60 dark:bg-orange-950/20',
        icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
    },
    {
        card: 'bg-pink-50/60 dark:bg-pink-950/20',
        icon: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',
    },
    {
        card: 'bg-amber-50/60 dark:bg-amber-950/20',
        icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    },
];

/*
|--------------------------------------------------------------------------
| Componente
|--------------------------------------------------------------------------
*/

export default function Create({
    permissions = [],
}: Props) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        name: '',
        permissions: [] as number[],
    });

    const [selectedPermissions, setSelectedPermissions] =
        useState<number[]>([]);

    /*
    |--------------------------------------------------------------------------
    | Seleccionar permiso
    |--------------------------------------------------------------------------
    */

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions((current) => {
            let updated: number[];

            if (current.includes(permissionId)) {
                updated = current.filter(
                    (id) => id !== permissionId,
                );
            } else {
                updated = [...current, permissionId];
            }

            setData('permissions', updated);

            return updated;
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Seleccionar todos los permisos de un grupo
    |--------------------------------------------------------------------------
    */

    const toggleGroup = (
        group: PermissionGroup,
    ) => {
        const ids = group.permissions.map(
            (permission) => permission.id,
        );

        const allSelected =
            ids.length > 0 &&
            ids.every((id) =>
                selectedPermissions.includes(id),
            );

        setSelectedPermissions((current) => {
            let updated: number[];

            if (allSelected) {
                updated = current.filter(
                    (id) => !ids.includes(id),
                );
            } else {
                updated = Array.from(
                    new Set([...current, ...ids]),
                );
            }

            setData('permissions', updated);

            return updated;
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Enviar
    |--------------------------------------------------------------------------
    */

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();

        post('/roles');
    };

    /*
    |--------------------------------------------------------------------------
    | Total permisos
    |--------------------------------------------------------------------------
    */

    const totalPermissions = permissions.reduce(
        (total, group) =>
            total + group.permissions.length,
        0,
    );

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Roles',
                    href: '/roles',
                },
                {
                    title: 'Nuevo rol',
                    href: '/roles/create',
                },
            ]}
        >
            <Head title="Nuevo rol" />

            <form
                onSubmit={handleSubmit}
                className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6"
            >
                {/* ======================================================
                    HEADER
                ====================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <div className="flex items-center gap-2">

                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                <ShieldCheck className="size-5 text-primary" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">
                                Nuevo rol
                            </h1>

                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Crea un rol y asigna los permisos
                            correspondientes.
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        asChild
                    >
                        <Link href="/roles">
                            <ArrowLeft className="mr-2 size-4" />
                            Volver
                        </Link>
                    </Button>

                </div>

                {/* ======================================================
                    INFORMACIÓN DEL ROL
                ====================================================== */}

                <Card>

                    <CardHeader className="border-b bg-muted/20">

                        <CardTitle className="text-base">
                            Información del rol
                        </CardTitle>

                        <p className="text-sm text-muted-foreground">
                            Define el nombre del rol.
                        </p>

                    </CardHeader>

                    <CardContent className="p-4">

                        <div className="max-w-xl space-y-2">

                            <label
                                htmlFor="name"
                                className="text-sm font-medium"
                            >
                                Nombre
                            </label>

                            <Input
                                id="name"
                                value={data.name}
                                onChange={(event) =>
                                    setData(
                                        'name',
                                        event.target.value,
                                    )
                                }
                                placeholder="Ej. Administrador"
                                autoFocus
                            />

                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name}
                                </p>
                            )}

                        </div>

                    </CardContent>

                </Card>

                {/* ======================================================
                    ENCABEZADO PERMISOS
                ====================================================== */}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                        <h2 className="text-base font-semibold">
                            Permisos
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            Selecciona los permisos que tendrá
                            este rol.
                        </p>
                    </div>

                    <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">

                        <CheckCircle2 className="size-3.5" />

                        {selectedPermissions.length} de{' '}
                        {totalPermissions} seleccionados

                    </div>

                </div>

                {/* ======================================================
                    PERMISOS
                ====================================================== */}

                {permissions.length === 0 ? (

                    <Card>

                        <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">

                            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                                <ShieldCheck className="size-5 text-muted-foreground" />
                            </div>

                            <h3 className="font-medium">
                                No hay permisos
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                No existen permisos registrados
                                en el sistema.
                            </p>

                        </CardContent>

                    </Card>

                ) : (

                    <div className="grid gap-5 md:grid-cols-2">

                        {permissions.map(
                            (group, index) => (
                                <PermissionCard
                                    key={group.name}
                                    group={group}
                                    color={
                                        colors[
                                            index %
                                                colors.length
                                        ]
                                    }
                                    selectedPermissions={
                                        selectedPermissions
                                    }
                                    onTogglePermission={
                                        togglePermission
                                    }
                                    onToggleGroup={
                                        toggleGroup
                                    }
                                />
                            ),
                        )}

                    </div>

                )}

                {errors.permissions && (
                    <p className="text-sm text-destructive">
                        {errors.permissions}
                    </p>
                )}

                {/* ======================================================
                    FOOTER
                ====================================================== */}

                <Card>

                    <CardContent className="flex flex-col-reverse gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="text-sm text-muted-foreground">

                            {selectedPermissions.length > 0
                                ? `${selectedPermissions.length} permisos seleccionados`
                                : 'No has seleccionado permisos'}

                        </div>

                        <div className="flex gap-2">

                            <Button
                                type="button"
                                variant="outline"
                                asChild
                            >
                                <Link href="/roles">
                                    Cancelar
                                </Link>
                            </Button>

                            <Button
                                type="submit"
                                disabled={processing}
                            >
                                <Save className="mr-2 size-4" />

                                {processing
                                    ? 'Guardando...'
                                    : 'Guardar rol'}
                            </Button>

                        </div>

                    </CardContent>

                </Card>

            </form>
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Card de permisos
|--------------------------------------------------------------------------
*/

function PermissionCard({
    group,
    color,
    selectedPermissions,
    onTogglePermission,
    onToggleGroup,
}: {
    group: PermissionGroup;
    color: {
        card: string;
        icon: string;
    };
    selectedPermissions: number[];
    onTogglePermission: (
        permissionId: number,
    ) => void;
    onToggleGroup: (
        group: PermissionGroup,
    ) => void;
}) {
    const permissionIds = group.permissions.map(
        (permission) => permission.id,
    );

    const selectedCount = permissionIds.filter(
        (id) => selectedPermissions.includes(id),
    ).length;

    const allSelected =
        permissionIds.length > 0 &&
        selectedCount === permissionIds.length;

    return (
        <Card className="overflow-hidden">

            {/* ======================================================
                HEADER DE CATEGORÍA
            ====================================================== */}

            <CardHeader className={color.card}>

                <div className="flex items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">

                        <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color.icon}`}
                        >
                            <ShieldCheck className="size-5" />
                        </div>

                        <div className="min-w-0">

                            <CardTitle className="truncate text-base capitalize">
                                {group.name}
                            </CardTitle>

                            <p className="mt-1 text-xs text-muted-foreground">
                                {selectedCount} de{' '}
                                {group.permissions.length}{' '}
                                seleccionados
                            </p>

                        </div>

                    </div>

                    {group.permissions.length > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 text-xs"
                            onClick={() =>
                                onToggleGroup(group)
                            }
                        >
                            {allSelected
                                ? 'Quitar todos'
                                : 'Todos'}
                        </Button>
                    )}

                </div>

            </CardHeader>

            {/* ======================================================
                LISTADO
            ====================================================== */}

            <CardContent className="p-0">

                <div className="divide-y">

                    {group.permissions.map(
                        (permission) => {
                            const checked =
                                selectedPermissions.includes(
                                    permission.id,
                                );

                            return (
                                <button
                                    key={permission.id}
                                    type="button"
                                    onClick={() =>
                                        onTogglePermission(
                                            permission.id,
                                        )
                                    }
                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                                >

                                    <div className="flex min-w-0 items-center gap-3">

                                        <div
                                            className={`flex size-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                                                checked
                                                    ? color.icon
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {checked ? (
                                                <Check className="size-4" />
                                            ) : (
                                                <ShieldCheck className="size-4" />
                                            )}
                                        </div>

                                        <div className="min-w-0">

                                            <p
                                                className={`truncate text-sm ${
                                                    checked
                                                        ? 'font-medium'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {permission.action}
                                            </p>

                                            <p className="truncate text-xs text-muted-foreground">
                                                {permission.name}
                                            </p>

                                        </div>

                                    </div>

                                    {/* CHECKBOX */}

                                    <div
                                        className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                            checked
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-input bg-background'
                                        }`}
                                    >
                                        {checked && (
                                            <Check className="size-3.5" />
                                        )}
                                    </div>

                                </button>
                            );
                        },
                    )}

                </div>

            </CardContent>

        </Card>
    );
}
