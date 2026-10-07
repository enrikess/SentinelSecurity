import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { permissionGroupColors, type PermissionGroupColor } from '@/components/security/permission-group-colors';

import { Pencil, Plus, Search, ShieldCheck, Trash2, Undo2, UsersRound } from 'lucide-react';

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

/*
|--------------------------------------------------------------------------
| Componente
|--------------------------------------------------------------------------
*/

export default function Index({ roles = [] }: Props) {
    const [search, setSearch] = useState('');

    const [localRoles, setLocalRoles] = useState<Role[]>(roles);

    const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

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
            Object.values(timers.current).forEach(clearTimeout);
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

        return role.name.toLowerCase().includes(value);
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

        setLocalRoles((current) => current.filter((item) => item.id !== role.id));

        /*
        |--------------------------------------------------------------------------
        | Toast
        |--------------------------------------------------------------------------
        */

        toast.custom(() => <DeleteToast role={role} onUndo={() => handleUndo(role)} />, {
            id: `delete-role-${role.id}`,
            duration: DELETE_DELAY,
            position: 'bottom-right',
        });

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
            const exists = current.some((item) => item.id === role.id);

            if (exists) {
                return current;
            }

            return [...current, role].sort((a, b) => a.name.localeCompare(b.name));
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
                toast.dismiss(`delete-role-${role.id}`);

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
                    const exists = current.some((item) => item.id === role.id);

                    if (exists) {
                        return current;
                    }

                    return [...current, role].sort((a, b) => a.name.localeCompare(b.name));
                });

                toast.dismiss(`delete-role-${role.id}`);

                toast.error('No se pudo eliminar el rol', {
                    description: 'El rol fue restaurado.',
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
                            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
                                <ShieldCheck className="text-primary size-5" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">Roles</h1>
                        </div>

                        <p className="text-muted-foreground mt-1 text-sm">Administra los roles y accesos del sistema.</p>
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
                            <div className="flex items-center gap-3">
                                <p className="text-sm font-medium">Roles registrados</p>

                                <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                    <ShieldCheck className="size-3" />
                                    {filteredRoles.length} {filteredRoles.length === 1 ? 'rol' : 'roles'}
                                </span>
                            </div>

                            <div className="relative w-full sm:w-80">
                                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar rol..." className="pl-9" />
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
                            <div className="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
                                <Search className="text-muted-foreground size-5" />
                            </div>

                            <h3 className="font-medium">No se encontraron roles</h3>

                            <p className="text-muted-foreground mt-1 text-sm">Intenta con otro término de búsqueda.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                        {filteredRoles.map((role, index) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                color={permissionGroupColors[index % permissionGroupColors.length]}
                                onDelete={handleDelete}
                            />
                        ))}
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

function RoleCard({ role, color, onDelete }: { role: Role; color: PermissionGroupColor; onDelete: (role: Role) => void }) {
    return (
        <Card className="overflow-hidden">
            {/* ======================================================
                HEADER
            ====================================================== */}

            <CardHeader className={color.card}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color.icon}`}>
                            <ShieldCheck className="size-5" />
                        </div>

                        <div className="min-w-0">
                            <CardTitle className="truncate text-base">{role.name}</CardTitle>

                            <p className="text-muted-foreground mt-1 text-xs">Rol del sistema</p>
                        </div>
                    </div>

                    {/* ==================================================
                        ACCIONES
                    ================================================== */}

                    <div className="flex shrink-0 items-center gap-1">
                        <Button asChild variant="ghost" size="icon" className="size-8" title="Editar rol">
                            <Link href={`/roles/${role.id}/edit`}>
                                <Pencil className="size-4" />

                                <span className="sr-only">Editar rol</span>
                            </Link>
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8"
                            title="Eliminar rol"
                            onClick={() => onDelete(role)}
                        >
                            <Trash2 className="size-4" />

                            <span className="sr-only">Eliminar rol</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {/* ======================================================
                CONTENIDO
            ====================================================== */}

            <CardContent className="px-4 py-4">
                <div className="bg-muted/20 flex items-center gap-3 rounded-lg border px-3 py-3">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-md ${color.icon}`}>
                        <UsersRound className="size-4" />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">Configuración de acceso</p>

                        <p className="text-muted-foreground text-xs">Los permisos se administran desde la edición del rol.</p>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                        <ShieldCheck className="size-3.5" />
                        Rol del sistema
                    </span>

                    <span className="text-muted-foreground text-xs">Creado el {formatDate(role.created_at)}</span>
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

function DeleteToast({ role, onUndo }: { role: Role; onUndo: () => void }) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startedAt = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startedAt;

            const remaining = Math.max(0, 100 - (elapsed / DELETE_DELAY) * 100);

            setProgress(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-background w-[350px] overflow-hidden rounded-lg border shadow-lg">
            <div className="flex items-center gap-3 px-3 py-3">
                <div className="bg-destructive/10 flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Trash2 className="text-destructive size-4" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Rol eliminado</p>

                    <p className="text-muted-foreground truncate text-xs">{role.name}</p>
                </div>

                <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5" onClick={onUndo}>
                    <Undo2 className="size-3.5" />
                    Deshacer
                </Button>
            </div>

            <div className="bg-muted h-1 w-full">
                <div
                    className="bg-destructive h-full transition-[width] duration-75"
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
| Fecha
|--------------------------------------------------------------------------
*/

function formatDate(date: string) {
    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(date));
}
