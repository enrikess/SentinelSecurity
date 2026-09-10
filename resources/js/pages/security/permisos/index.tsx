import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';

import {
    KeyRound,
    Plus,
    Search,
    Pencil,
    Trash2,
    List,
    PlusCircle,
    FilePenLine,
    ShieldCheck,
    XCircle,
} from 'lucide-react';

import { toast } from 'sonner';

/*
|--------------------------------------------------------------------------
| Tipos
|--------------------------------------------------------------------------
*/

interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

interface PermissionCategory {
    name: string;
    permissions: Permission[];
}

interface Props {
    permissions: Permission[];
}

/*
|--------------------------------------------------------------------------
| Configuración visual
|--------------------------------------------------------------------------
*/

const categoryColors = [
    {
        background: 'bg-blue-50/80 dark:bg-blue-950/20',
        icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    },
    {
        background: 'bg-emerald-50/80 dark:bg-emerald-950/20',
        icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    },
    {
        background: 'bg-violet-50/80 dark:bg-violet-950/20',
        icon: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    },
    {
        background: 'bg-orange-50/80 dark:bg-orange-950/20',
        icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
    },
    {
        background: 'bg-pink-50/80 dark:bg-pink-950/20',
        icon: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',
    },
    {
        background: 'bg-amber-50/80 dark:bg-amber-950/20',
        icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    },
];

/*
|--------------------------------------------------------------------------
| Componente principal
|--------------------------------------------------------------------------
*/

export default function Index({ permissions }: Props) {
    const [search, setSearch] = useState('');

    const [localPermissions, setLocalPermissions] =
        useState<Permission[]>(permissions);

    const [deletingPermissions, setDeletingPermissions] = useState<
        Record<number, Permission>
    >({});

    const timers = useRef<
        Record<number, ReturnType<typeof setTimeout>>
    >({});

    /*
    |--------------------------------------------------------------------------
    | Sincronizar con Inertia
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        setLocalPermissions(permissions);
    }, [permissions]);

    /*
    |--------------------------------------------------------------------------
    | Limpiar timers
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        return () => {
            Object.values(timers.current).forEach(clearTimeout);
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Filtrar
    |--------------------------------------------------------------------------
    */

    const filteredPermissions = localPermissions.filter((permission) => {
        const value = search.toLowerCase().trim();

        if (!value) {
            return true;
        }

        return permission.name.toLowerCase().includes(value);
    });

    /*
    |--------------------------------------------------------------------------
    | Agrupar permisos
    |--------------------------------------------------------------------------
    |
    | usuarios.listar
    | usuarios.crear
    | usuarios.editar
    |
    | =>
    |
    | Usuarios
    |   ├── listar
    |   ├── crear
    |   └── editar
    |
    */

    const categories = groupPermissions(filteredPermissions);

    /*
    |--------------------------------------------------------------------------
    | Eliminar
    |--------------------------------------------------------------------------
    */

    const handleDelete = (permission: Permission) => {
        if (deletingPermissions[permission.id]) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Quitar inmediatamente de la interfaz
        |--------------------------------------------------------------------------
        */

        setLocalPermissions((current) =>
            current.filter((item) => item.id !== permission.id),
        );

        /*
        |--------------------------------------------------------------------------
        | Guardar temporalmente
        |--------------------------------------------------------------------------
        */

        setDeletingPermissions((current) => ({
            ...current,
            [permission.id]: permission,
        }));

        /*
        |--------------------------------------------------------------------------
        | Toast
        |--------------------------------------------------------------------------
        */

        toast.custom(
            (toastId) => (
                <DeleteToast
                    permission={permission}
                    toastId={toastId}
                    onUndo={() => handleUndo(permission)}
                />
            ),
            {
                id: `delete-permission-${permission.id}`,
                duration: 5000,
                position: 'bottom-right',
            },
        );

        /*
        |--------------------------------------------------------------------------
        | Eliminación definitiva
        |--------------------------------------------------------------------------
        */

        timers.current[permission.id] = setTimeout(() => {
            deletePermissionPermanently(permission);
        }, 5000);
    };

    /*
    |--------------------------------------------------------------------------
    | Deshacer
    |--------------------------------------------------------------------------
    */

    const handleUndo = (permission: Permission) => {
        if (timers.current[permission.id]) {
            clearTimeout(timers.current[permission.id]);

            delete timers.current[permission.id];
        }

        /*
        |--------------------------------------------------------------------------
        | Restaurar
        |--------------------------------------------------------------------------
        */

        setLocalPermissions((current) => {
            const exists = current.some(
                (item) => item.id === permission.id,
            );

            if (exists) {
                return current;
            }

            return [...current, permission].sort((a, b) =>
                a.name.localeCompare(b.name),
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Quitar de pendientes
        |--------------------------------------------------------------------------
        */

        setDeletingPermissions((current) => {
            const copy = { ...current };

            delete copy[permission.id];

            return copy;
        });

        /*
        |--------------------------------------------------------------------------
        | Cerrar toast
        |--------------------------------------------------------------------------
        */

        toast.dismiss(`delete-permission-${permission.id}`);

        toast.success('Eliminación cancelada', {
            description: `${permission.name} fue restaurado.`,
            duration: 2500,
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Eliminar definitivamente
    |--------------------------------------------------------------------------
    */

    const deletePermissionPermanently = (
        permission: Permission,
    ) => {
        delete timers.current[permission.id];

        router.delete(`/permisos/${permission.id}`, {
            preserveScroll: true,

            onSuccess: () => {
                setDeletingPermissions((current) => {
                    const copy = { ...current };

                    delete copy[permission.id];

                    return copy;
                });

                toast.dismiss(
                    `delete-permission-${permission.id}`,
                );

                toast.success('Permiso eliminado', {
                    description: `${permission.name} fue eliminado correctamente.`,
                    duration: 2500,
                });
            },

            onError: () => {
                /*
                |--------------------------------------------------------------------------
                | Restaurar si falla
                |--------------------------------------------------------------------------
                */

                setLocalPermissions((current) => {
                    const exists = current.some(
                        (item) => item.id === permission.id,
                    );

                    if (exists) {
                        return current;
                    }

                    return [...current, permission].sort((a, b) =>
                        a.name.localeCompare(b.name),
                    );
                });

                setDeletingPermissions((current) => {
                    const copy = { ...current };

                    delete copy[permission.id];

                    return copy;
                });

                toast.dismiss(
                    `delete-permission-${permission.id}`,
                );

                toast.error('No se pudo eliminar el permiso', {
                    description:
                        'El permiso fue restaurado.',
                    duration: 3500,
                });
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
                    title: 'Permisos',
                    href: '/permisos',
                },
            ]}
        >
            <Head title="Permisos" />

            <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">

                {/* ==========================================================
                    HEADER
                ========================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                <KeyRound className="size-5 text-primary" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">
                                Permisos
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Administra los permisos del sistema.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/permisos/create">
                            <Plus className="mr-2 size-4" />
                            Nuevo permiso
                        </Link>
                    </Button>
                </div>

                {/* ==========================================================
                    BUSCADOR
                ========================================================== */}

                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <p className="text-sm font-medium">
                                    Categorías de permisos
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    {categories.length}{' '}
                                    {categories.length === 1
                                        ? 'categoría'
                                        : 'categorías'}{' '}
                                    ·{' '}
                                    {filteredPermissions.length}{' '}
                                    {filteredPermissions.length === 1
                                        ? 'permiso'
                                        : 'permisos'}
                                </p>
                            </div>

                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Buscar permiso..."
                                    className="pl-9"
                                />
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* ==========================================================
                    CATEGORÍAS
                ========================================================== */}

                {categories.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                                <Search className="size-5 text-muted-foreground" />
                            </div>

                            <h3 className="font-medium">
                                No se encontraron permisos
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Intenta con otro término de búsqueda.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">

                        {categories.map((category, index) => {
                            const color =
                                categoryColors[
                                    index % categoryColors.length
                                ];

                            return (
                                <CategoryCard
                                    key={category.name}
                                    category={category}
                                    color={color}
                                    onDelete={handleDelete}
                                />
                            );
                        })}

                    </div>
                )}
            </div>
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Card de categoría
|--------------------------------------------------------------------------
*/

function CategoryCard({
    category,
    color,
    onDelete,
}: {
    category: PermissionCategory;
    color: {
        background: string;
        icon: string;
    };
    onDelete: (permission: Permission) => void;
}) {
    return (
        <Card className="overflow-hidden">

            {/* ==========================================================
                HEADER DE CATEGORÍA
            ========================================================== */}

            <CardHeader className={color.background}>
                <div className="flex items-center justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-3">

                        <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color.icon}`}
                        >
                            <ShieldCheck className="size-5" />
                        </div>

                        <div className="min-w-0">
                            <CardTitle className="truncate text-base capitalize">
                                {formatCategoryName(category.name)}
                            </CardTitle>

                            <CardDescription>
                                Permisos de {category.name}
                            </CardDescription>
                        </div>

                    </div>

                    <Badge
                        variant="secondary"
                        className="shrink-0"
                    >
                        {category.permissions.length}{' '}
                        {category.permissions.length === 1
                            ? 'permiso'
                            : 'permisos'}
                    </Badge>

                </div>
            </CardHeader>

            {/* ==========================================================
                PERMISOS
            ========================================================== */}

            <CardContent className="p-0">

                <div className="divide-y">

                    {category.permissions.map((permission) => (
                        <PermissionRow
                            key={permission.id}
                            permission={permission}
                            onDelete={onDelete}
                        />
                    ))}

                </div>

            </CardContent>
        </Card>
    );
}

/*
|--------------------------------------------------------------------------
| Fila de permiso
|--------------------------------------------------------------------------
*/

function PermissionRow({
    permission,
    onDelete,
}: {
    permission: Permission;
    onDelete: (permission: Permission) => void;
}) {
    const action = getAction(permission.name);

    const actionInfo = getActionInfo(action);

    return (
        <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">

            {/* Icono */}
            <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-md ${actionInfo.background}`}
            >
                <actionInfo.icon className="size-4" />
            </div>

            {/* Información */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    {actionInfo.label}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                    {permission.name}
                </p>
            </div>

            {/* Acciones */}
            <div className="flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">

                <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    title="Editar permiso"
                >
                    <Link
                        href={`/permisos/${permission.id}/edit`}
                    >
                        <Pencil className="size-4" />

                        <span className="sr-only">
                            Editar permiso
                        </span>
                    </Link>
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Eliminar permiso"
                    onClick={() => onDelete(permission)}
                >
                    <Trash2 className="size-4" />

                    <span className="sr-only">
                        Eliminar permiso
                    </span>
                </Button>

            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Toast de eliminación
|--------------------------------------------------------------------------
*/

function DeleteToast({
    permission,
    toastId,
    onUndo,
}: {
    permission: Permission;
    toastId: string | number;
    onUndo: () => void;
}) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startedAt = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startedAt;

            const remaining = Math.max(
                0,
                100 - (elapsed / 5000) * 100,
            );

            setProgress(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-[350px] overflow-hidden rounded-lg border bg-background shadow-lg">

            <div className="flex items-center gap-3 px-3 py-3">

                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <Trash2 className="size-4 text-destructive" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                        Permiso eliminado
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                        {permission.name}
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={onUndo}
                >
                    Deshacer
                </Button>

            </div>

            <div className="h-1 w-full bg-muted">
                <div
                    className="h-full bg-destructive transition-[width] duration-75"
                    style={{
                        width: `${progress}%`,
                    }}
                />
            </div>

        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Agrupar permisos
|--------------------------------------------------------------------------
*/

function groupPermissions(
    permissions: Permission[],
): PermissionCategory[] {
    const grouped: Record<string, Permission[]> = {};

    permissions.forEach((permission) => {
        const parts = permission.name.split('.');

        const category =
            parts.length > 1
                ? parts[0]
                : 'general';

        if (!grouped[category]) {
            grouped[category] = [];
        }

        grouped[category].push(permission);
    });

    return Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, permissions]) => ({
            name,
            permissions: permissions.sort((a, b) =>
                a.name.localeCompare(b.name),
            ),
        }));
}

/*
|--------------------------------------------------------------------------
| Obtener acción
|--------------------------------------------------------------------------
*/

function getAction(name: string): string {
    const parts = name.split('.');

    if (parts.length <= 1) {
        return name;
    }

    return parts[parts.length - 1];
}

/*
|--------------------------------------------------------------------------
| Información visual de acción
|--------------------------------------------------------------------------
*/

function getActionInfo(action: string) {
    switch (action.toLowerCase()) {
        case 'listar':
        case 'list':
            return {
                label: 'Listar',
                icon: List,
                background:
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
            };

        case 'crear':
        case 'create':
            return {
                label: 'Crear',
                icon: PlusCircle,
                background:
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            };

        case 'editar':
        case 'edit':
        case 'actualizar':
            return {
                label: 'Editar',
                icon: FilePenLine,
                background:
                    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            };

        case 'eliminar':
        case 'delete':
        case 'borrar':
            return {
                label: 'Eliminar',
                icon: XCircle,
                background:
                    'bg-red-500/10 text-red-600 dark:text-red-400',
            };

        default:
            return {
                label: capitalize(action),
                icon: ShieldCheck,
                background:
                    'bg-muted text-muted-foreground',
            };
    }
}

/*
|--------------------------------------------------------------------------
| Nombre de categoría
|--------------------------------------------------------------------------
*/

function formatCategoryName(category: string) {
    if (category === 'general') {
        return 'General';
    }

    return category
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/*
|--------------------------------------------------------------------------
| Capitalizar
|--------------------------------------------------------------------------
*/

function capitalize(value: string) {
    if (!value) {
        return '';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}
