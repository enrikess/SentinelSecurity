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
    Pencil,
    Trash2,
    UserRound,
    Plus,
    Search,
    Undo2,
    CheckCircle2
} from 'lucide-react';

import { toast } from 'sonner';

/*
|--------------------------------------------------------------------------
| Tipos
|--------------------------------------------------------------------------
*/

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
}

interface Props {
    users: User[];
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

export default function Index({ users }: Props) {
    const [search, setSearch] = useState('');
    const [localUsers, setLocalUsers] = useState<User[]>(users);

    const [deletingUsers, setDeletingUsers] = useState<
        Record<number, User>
    >({});

    const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

    /*
    |--------------------------------------------------------------------------
    | Sincronizar usuarios cuando Inertia actualiza las props
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        setLocalUsers(users);
    }, [users]);

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

    const filteredUsers = localUsers.filter((user) => {
        const value = search.toLowerCase().trim();

        if (!value) {
            return true;
        }

        return (
            user.name.toLowerCase().includes(value) ||
            user.email.toLowerCase().includes(value)
        );
    });

    /*
    |--------------------------------------------------------------------------
    | Eliminar usuario
    |--------------------------------------------------------------------------
    */

    const handleDelete = (user: User) => {
        // Evitar doble eliminación
        if (deletingUsers[user.id]) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Quitar inmediatamente de la tabla
        |--------------------------------------------------------------------------
        */

        setLocalUsers((current) =>
            current.filter((item) => item.id !== user.id)
        );

        /*
        |--------------------------------------------------------------------------
        | Guardamos temporalmente el usuario
        |--------------------------------------------------------------------------
        */

        setDeletingUsers((current) => ({
            ...current,
            [user.id]: user,
        }));

        /*
        |--------------------------------------------------------------------------
        | Toast
        |--------------------------------------------------------------------------
        */

        toast.custom(
            (toastId) => (
                <DeleteToast
                    user={user}
                    toastId={toastId}
                    onUndo={() => handleUndo(user)}
                />
            ),
            {
                id: `delete-${user.id}`,
                duration: DELETE_DELAY,
                position: 'bottom-right',
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Ejecutar eliminación definitiva después del tiempo
        |--------------------------------------------------------------------------
        */

        timers.current[user.id] = setTimeout(() => {
            deleteUserPermanently(user);
        }, DELETE_DELAY);
    };

    /*
    |--------------------------------------------------------------------------
    | Deshacer
    |--------------------------------------------------------------------------
    */

    const handleUndo = (user: User) => {
        /*
        |--------------------------------------------------------------------------
        | Cancelar timer
        |--------------------------------------------------------------------------
        */

        if (timers.current[user.id]) {
            clearTimeout(timers.current[user.id]);

            delete timers.current[user.id];
        }

        /*
        |--------------------------------------------------------------------------
        | Restaurar usuario
        |--------------------------------------------------------------------------
        */

        setLocalUsers((current) => {
            const exists = current.some(
                (item) => item.id === user.id
            );

            if (exists) {
                return current;
            }

            return [...current, user].sort((a, b) =>
                a.name.localeCompare(b.name)
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Quitar de eliminaciones pendientes
        |--------------------------------------------------------------------------
        */

        setDeletingUsers((current) => {
            const copy = { ...current };

            delete copy[user.id];

            return copy;
        });

        /*
        |--------------------------------------------------------------------------
        | Cerrar toast
        |--------------------------------------------------------------------------
        */

        toast.dismiss(`delete-${user.id}`);

        /*
        |--------------------------------------------------------------------------
        | Confirmación
        |--------------------------------------------------------------------------
        */

        toast.success('Eliminación cancelada', {
            description: `${user.name} fue restaurado.`,
            duration: 2500,
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Eliminación definitiva
    |--------------------------------------------------------------------------
    */

    const deleteUserPermanently = (user: User) => {
        delete timers.current[user.id];

        router.delete(`/usuarios/${user.id}`, {
            preserveScroll: true,

            onSuccess: () => {
                setDeletingUsers((current) => {
                    const copy = { ...current };

                    delete copy[user.id];

                    return copy;
                });

                toast.dismiss(`delete-${user.id}`);

                toast.success('Usuario eliminado', {
                    description: `${user.name} fue eliminado correctamente.`,
                    duration: 2500,
                });
            },

            onError: () => {
                /*
                |--------------------------------------------------------------------------
                | Si falla el DELETE, restauramos el usuario
                |--------------------------------------------------------------------------
                */

                setLocalUsers((current) => {
                    const exists = current.some(
                        (item) => item.id === user.id
                    );

                    if (exists) {
                        return current;
                    }

                    return [...current, user].sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                });

                setDeletingUsers((current) => {
                    const copy = { ...current };

                    delete copy[user.id];

                    return copy;
                });

                toast.dismiss(`delete-${user.id}`);

                toast.error('No se pudo eliminar el usuario', {
                    description:
                        'El usuario fue restaurado en la tabla.',
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
                    title: 'Usuarios',
                    href: '/usuarios',
                },
            ]}
        >
            <Head title="Usuarios" />

            <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
                {/* ==========================================================
                    HEADER
                ========================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                <UserRound className="size-5 text-primary" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">
                                Usuarios
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Administra los usuarios del sistema.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/usuarios/create">
                            <Plus className="mr-2 size-4" />
                            Nuevo usuario
                        </Link>
                    </Button>
                </div>

                {/* ==========================================================
                    TABLA
                ========================================================== */}

                <Card className="overflow-hidden">
                    <CardHeader className="border-b bg-muted/20">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-base">
                                    Lista de usuarios
                                </CardTitle>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    {filteredUsers.length}{' '}
                                    {filteredUsers.length === 1
                                        ? 'usuario'
                                        : 'usuarios'}
                                </p>
                            </div>

                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Buscar usuario..."
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                                    <Search className="size-5 text-muted-foreground" />
                                </div>

                                <h3 className="font-medium">
                                    No se encontraron usuarios
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Intenta con otro término de búsqueda.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30">
                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                Usuario
                                            </th>

                                            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                                                Correo
                                            </th>

                                            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                                                Estado
                                            </th>

                                            <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                                                Registro
                                            </th>

                                            <th className="w-[120px] px-4 py-3 text-right font-medium text-muted-foreground">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredUsers.map(
                                            (user) => (
                                                <UserRow
                                                    key={user.id}
                                                    user={user}
                                                    onDelete={
                                                        handleDelete
                                                    }
                                                />
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

/*
|--------------------------------------------------------------------------
| Fila
|--------------------------------------------------------------------------
*/

function UserRow({
    user,
    onDelete,
}: {
    user: User;
    onDelete: (user: User) => void;
}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setVisible(true);
        });

        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <tr
            className={`
                border-b last:border-0
                transition-all duration-300
                ${
                    visible
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-3 opacity-0'
                }
            `}
        >
            {/* Usuario */}

            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-semibold text-primary">
                            {user.name
                                .charAt(0)
                                .toUpperCase()}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <p className="truncate font-medium">
                            {user.name}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                            ID #{user.id}
                        </p>
                    </div>
                </div>
            </td>

            {/* Correo */}

            <td className="px-4 py-3">
                <span className="text-muted-foreground">
                    {user.email}
                </span>
            </td>

            {/* Estado */}

            <td className="hidden px-4 py-3 md:table-cell">
                {user.email_verified_at ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Verificado
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Pendiente
                    </span>
                )}
            </td>

            {/* Fecha */}

            <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                {formatDate(user.created_at)}
            </td>

            {/* Acciones */}

            <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Editar usuario"
                    >
                        <Link href={`/usuarios/${user.id}/edit`}>
                            <Pencil className="size-4" />
                            <span className="sr-only">
                                Editar usuario
                            </span>
                        </Link>
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Eliminar usuario"
                        onClick={() => onDelete(user)}
                    >
                        <Trash2 className="size-4" />

                        <span className="sr-only">
                            Eliminar usuario
                        </span>
                    </Button>
                </div>
            </td>
        </tr>
    );
}

/*
|--------------------------------------------------------------------------
| Toast de eliminación
|--------------------------------------------------------------------------
*/

function DeleteToast({
    user,
    toastId,
    onUndo,
}: {
    user: User;
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
                100 - (elapsed / DELETE_DELAY) * 100
            );

            setProgress(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-[340px] overflow-hidden rounded-lg border bg-background shadow-lg">
            {/* Contenido */}

            <div className="flex items-center gap-3 px-3 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <Trash2 className="size-4 text-destructive" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                        Usuario eliminado
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                        {user.name}
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

            {/* Progreso */}

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
