import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import {
    ShieldCheck,
    Plus,
    Search,
    Pencil,
    Trash2,
    Undo2,
    UsersRound,
} from 'lucide-react';

import { toast } from 'sonner';

/*
|--------------------------------------------------------------------------
| Tipos
|--------------------------------------------------------------------------
*/

interface Role {
    id: number;
    name: string;
    created_at: string;
}

interface Props {
    roles?: Role[];
}

/*
|--------------------------------------------------------------------------
| Configuración
|--------------------------------------------------------------------------
*/

const DELETE_DELAY = 5000;

const roleColors = [
    {
        card: 'bg-blue-50/70 dark:bg-blue-950/20',
        icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    },
    {
        card: 'bg-emerald-50/70 dark:bg-emerald-950/20',
        icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
    },
    {
        card: 'bg-violet-50/70 dark:bg-violet-950/20',
        icon: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    },
    {
        card: 'bg-orange-50/70 dark:bg-orange-950/20',
        icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
    },
    {
        card: 'bg-pink-50/70 dark:bg-pink-950/20',
        icon: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',
    },
    {
        card: 'bg-amber-50/70 dark:bg-amber-950/20',
        icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    },
];

/*
|--------------------------------------------------------------------------
| Componente
|--------------------------------------------------------------------------
*/

export default function Index({ roles = [] }: Props) {
    const [search, setSearch] = useState('');

    const [localRoles, setLocalRoles] =
        useState<Role[]>(roles);

    const timers = useRef<
        Record<number, ReturnType<typeof setTimeout>>
    >({});

    /*
    |--------------------------------------------------------------------------
    | Sincronizar props
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        setLocalRoles(roles ?? []);
    }, [roles]);

    /*
    |--------------------------------------------------------------------------
    | Limpiar timers
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        return () => {
            Object.values(timers.current).forEach(
                clearTimeout,
            );
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Buscar
    |--------------------------------------------------------------------------
    */

    const filteredRoles = localRoles.filter((role) => {
        const value = search.toLowerCase().trim();

        if (!value) {
            return true;
        }

        return role.name
            .toLowerCase()
            .includes(value);
    });

    /*
    |--------------------------------------------------------------------------
    | Eliminar
    |--------------------------------------------------------------------------
    */

    const handleDelete = (role: Role) => {
        /*
        |--------------------------------------------------------------------------
        | Quitar inmediatamente de la pantalla
        |--------------------------------------------------------------------------
        */

        setLocalRoles((current) =>
            current.filter(
                (item) => item.id !== role.id,
            ),
        );

        /*
        |--------------------------------------------------------------------------
        | Toast
        |--------------------------------------------------------------------------
        */

        toast.custom(
            () => (
                <DeleteToast
                    role={role}
                    onUndo={() => handleUndo(role)}
                />
            ),
            {
                id: `delete-role-${role.id}`,
                duration: DELETE_DELAY,
                position: 'bottom-right',
            },
        );

        /*
        |--------------------------------------------------------------------------
        | Esperar antes de eliminar definitivamente
        |--------------------------------------------------------------------------
        */

        timers.current[role.id] = setTimeout(() => {
            deleteRolePermanently(role);
        }, DELETE_DELAY);
    };

    /*
    |--------------------------------------------------------------------------
    | Deshacer
    |--------------------------------------------------------------------------
    */

    const handleUndo = (role: Role) => {
        if (timers.current[role.id]) {
            clearTimeout(timers.current[role.id]);

            delete timers.current[role.id];
        }

        /*
        |--------------------------------------------------------------------------
        | Restaurar
        |--------------------------------------------------------------------------
        */

        setLocalRoles((current) => {
            const exists = current.some(
                (item) => item.id === role.id,
            );

            if (exists) {
                return current;
            }

            return [...current, role].sort((a, b) =>
                a.name.localeCompare(b.name),
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Cerrar toast
        |--------------------------------------------------------------------------
        */

        toast.dismiss(`delete-role-${role.id}`);

        toast.success('Eliminación cancelada', {
            description: `${role.name} fue restaurado.`,
            duration: 2500,
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Eliminación definitiva
    |--------------------------------------------------------------------------
    */

    const deleteRolePermanently = (role: Role) => {
        delete timers.current[role.id];

        router.delete(`/roles/${role.id}`, {
            preserveScroll: true,

            onSuccess: () => {
                toast.dismiss(
                    `delete-role-${role.id}`,
                );

                toast.success('Rol eliminado', {
                    description: `${role.name} fue eliminado correctamente.`,
                    duration: 2500,
                });
            },

            onError: () => {
                /*
                |--------------------------------------------------------------------------
                | Restaurar si falla
                |--------------------------------------------------------------------------
                */

                setLocalRoles((current) => {
                    const exists = current.some(
                        (item) => item.id === role.id,
                    );

                    if (exists) {
                        return current;
                    }

                    return [...current, role].sort(
                        (a, b) =>
                            a.name.localeCompare(b.name),
                    );
                });

                toast.dismiss(
                    `delete-role-${role.id}`,
                );

                toast.error(
                    'No se pudo eliminar el rol',
                    {
                        description:
                            'El rol fue restaurado.',
                        duration: 3500,
                    },
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
                    title: 'Roles',
                    href: '/roles',
                },
            ]}
        >
            <Head title="Roles" />

            <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">

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
                                Roles
                            </h1>

                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Administra los roles y accesos
                            del sistema.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/roles/create">
                            <Plus className="mr-2 size-4" />
                            Nuevo rol
                        </Link>
                    </Button>

                </div>

                {/* ======================================================
                    BUSCADOR
                ====================================================== */}

                <Card>
                    <CardContent className="p-4">

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div>
                                <p className="text-sm font-medium">
                                    Roles registrados
                                </p>

                                <p className="text-xs text-muted-foreground">
                                    {filteredRoles.length}{' '}
                                    {filteredRoles.length === 1
                                        ? 'rol'
                                        : 'roles'}
                                </p>
                            </div>

                            <div className="relative w-full sm:w-80">

                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Buscar rol..."
                                    className="pl-9"
                                />

                            </div>

                        </div>

                    </CardContent>
                </Card>

                {/* ======================================================
                    CARDS
                ====================================================== */}

                {filteredRoles.length === 0 ? (

                    <Card>
                        <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">

                            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                                <Search className="size-5 text-muted-foreground" />
                            </div>

                            <h3 className="font-medium">
                                No se encontraron roles
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Intenta con otro término de búsqueda.
                            </p>

                        </CardContent>
                    </Card>

                ) : (

                    <div className="grid gap-5 md:grid-cols-2">

                        {filteredRoles.map(
                            (role, index) => (
                                <RoleCard
                                    key={role.id}
                                    role={role}
                                    color={
                                        roleColors[
                                            index %
                                                roleColors.length
                                        ]
                                    }
                                    onDelete={handleDelete}
                                />
                            ),
                        )}

                    </div>

                )}

            </div>
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Card del rol
|--------------------------------------------------------------------------
*/

function RoleCard({
    role,
    color,
    onDelete,
}: {
    role: Role;
    color: {
        card: string;
        icon: string;
    };
    onDelete: (role: Role) => void;
}) {
    return (
        <Card className="overflow-hidden">

            {/* ======================================================
                HEADER
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

                            <CardTitle className="truncate text-base">
                                {role.name}
                            </CardTitle>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Rol del sistema
                            </p>

                        </div>

                    </div>

                    {/* ==================================================
                        ACCIONES
                    ================================================== */}

                    <div className="flex shrink-0 items-center gap-1">

                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Editar rol"
                        >
                            <Link
                                href={`/roles/${role.id}/edit`}
                            >
                                <Pencil className="size-4" />

                                <span className="sr-only">
                                    Editar rol
                                </span>
                            </Link>
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Eliminar rol"
                            onClick={() =>
                                onDelete(role)
                            }
                        >
                            <Trash2 className="size-4" />

                            <span className="sr-only">
                                Eliminar rol
                            </span>
                        </Button>

                    </div>

                </div>

            </CardHeader>

            {/* ======================================================
                CONTENIDO
            ====================================================== */}

            <CardContent className="px-4 py-4">

                <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-3">

                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                        <UsersRound className="size-4 text-primary" />
                    </div>

                    <div>

                        <p className="text-sm font-medium">
                            Configuración de acceso
                        </p>

                        <p className="text-xs text-muted-foreground">
                            Los permisos se administran
                            desde la edición del rol.
                        </p>

                    </div>

                </div>

            </CardContent>

        </Card>
    );
}

/*
|--------------------------------------------------------------------------
| Toast de eliminación
|--------------------------------------------------------------------------
*/

function DeleteToast({
    role,
    onUndo,
}: {
    role: Role;
    onUndo: () => void;
}) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startedAt = Date.now();

        const interval = setInterval(() => {
            const elapsed =
                Date.now() - startedAt;

            const remaining = Math.max(
                0,
                100 -
                    (elapsed / DELETE_DELAY) *
                        100,
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
                        Rol eliminado
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                        {role.name}
                    </p>

                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 gap-1.5"
                    onClick={onUndo}
                >
                    <Undo2 className="size-3.5" />
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
