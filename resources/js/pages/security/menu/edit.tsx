import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

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
    ChevronDown,
    FolderTree,
    KeyRound,
    Menu as MenuIcon,
    Save,
} from 'lucide-react';

interface Group {
    id: number;
    name: string;
}

interface Permission {
    id: number;
    name: string;
}

interface MenuItem {
    id: number;
    parent_id: number | null;
    permission_id: number | null;
    name: string;
    slug: string;
    route: string | null;
    icon: string | null;
    type: 'section' | 'group' | 'menu';
    sort_order: number;
    is_active: boolean;
}

interface Props {
    menu: MenuItem;
    groups: Group[];
    permissions: Permission[];
    types: {
        value: string;
        label: string;
    }[];
}

export default function Edit({
    menu,
    groups = [],
    permissions = [],
    types = [],
}: Props) {
    const { data, setData, put, processing, errors } = useForm({
        parent_id: menu.parent_id,
        permission_id: menu.permission_id,
        name: menu.name,
        slug: menu.slug,
        route: menu.route ?? '',
        icon: menu.icon ?? '',
        type: menu.type,
        sort_order: menu.sort_order,
        is_active: menu.is_active,
    });

    const [permissionSearch, setPermissionSearch] = useState('');
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
        {},
    );

    const groupedPermissions = useMemo(() => {
        const groupsMap: Record<string, Permission[]> = {};

        permissions.forEach((permission) => {
            const category =
                permission.name.split('.')[0] || 'general';

            if (!groupsMap[category]) {
                groupsMap[category] = [];
            }

            groupsMap[category].push(permission);
        });

        return Object.entries(groupsMap)
            .map(([name, permissions]) => ({
                name,
                permissions: permissions.filter((permission) =>
                    permission.name
                        .toLowerCase()
                        .includes(permissionSearch.toLowerCase()),
                ),
            }))
            .filter((group) => group.permissions.length > 0);
    }, [permissions, permissionSearch]);

    const toggleGroup = (name: string) => {
        setOpenGroups((current) => ({
            ...current,
            [name]: !current[name],
        }));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();

        put(`/menus/${menu.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Menús',
                    href: '/menus',
                },
                {
                    title: `Editar ${menu.name}`,
                    href: `/menus/${menu.id}/edit`,
                },
            ]}
        >
            <Head title={`Editar ${menu.name}`} />

            <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">

                {/* HEADER */}
                <div className="flex items-center gap-3">
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-9"
                    >
                        <Link href="/menus">
                            <ArrowLeft className="size-4" />

                            <span className="sr-only">
                                Volver
                            </span>
                        </Link>
                    </Button>

                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                <MenuIcon className="size-5 text-primary" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">
                                Editar menú
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Modifica la configuración de este elemento.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-5">

                    {/* INFORMACIÓN */}
                    <Card>
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-base">
                                Información del menú
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="grid gap-5 p-5 md:grid-cols-2">

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Tipo
                                </label>

                                <select
                                    value={data.type}
                                    onChange={(e) =>
                                        setData(
                                            'type',
                                            e.target.value as
                                                | 'section'
                                                | 'group'
                                                | 'menu',
                                        )
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {types.map((type) => (
                                        <option
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </option>
                                    ))}
                                </select>

                                {errors.type && (
                                    <p className="text-xs text-destructive">
                                        {errors.type}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Nombre interno
                                </label>

                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                />

                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Slug
                                </label>

                                <Input
                                    value={data.slug}
                                    onChange={(e) =>
                                        setData(
                                            'slug',
                                            e.target.value,
                                        )
                                    }
                                />

                                {errors.slug && (
                                    <p className="text-xs text-destructive">
                                        {errors.slug}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Orden
                                </label>

                                <Input
                                    type="number"
                                    min={0}
                                    value={data.sort_order}
                                    onChange={(e) =>
                                        setData(
                                            'sort_order',
                                            Number(e.target.value),
                                        )
                                    }
                                />

                                {errors.sort_order && (
                                    <p className="text-xs text-destructive">
                                        {errors.sort_order}
                                    </p>
                                )}
                            </div>

                            {data.type === 'menu' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Grupo padre
                                        </label>

                                        <select
                                            value={
                                                data.parent_id ?? ''
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'parent_id',
                                                    e.target.value
                                                        ? Number(
                                                              e.target.value,
                                                          )
                                                        : null,
                                                )
                                            }
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="">
                                                Sin grupo
                                            </option>

                                            {groups.map((group) => (
                                                <option
                                                    key={group.id}
                                                    value={group.id}
                                                >
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>

                                        {errors.parent_id && (
                                            <p className="text-xs text-destructive">
                                                {errors.parent_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Ruta
                                        </label>

                                        <Input
                                            value={data.route}
                                            onChange={(e) =>
                                                setData(
                                                    'route',
                                                    e.target.value,
                                                )
                                            }
                                        />

                                        {errors.route && (
                                            <p className="text-xs text-destructive">
                                                {errors.route}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Icono
                                        </label>

                                        <Input
                                            value={data.icon}
                                            onChange={(e) =>
                                                setData(
                                                    'icon',
                                                    e.target.value,
                                                )
                                            }
                                        />

                                        {errors.icon && (
                                            <p className="text-xs text-destructive">
                                                {errors.icon}
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex items-center gap-3 md:col-span-2">
                                <input
                                    id="is_active"
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                    className="size-4 rounded border-input"
                                />

                                <label
                                    htmlFor="is_active"
                                    className="text-sm font-medium"
                                >
                                    Menú activo
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* PERMISOS */}
                    {data.type === 'menu' && (
                        <Card>
                            <CardHeader className="border-b bg-muted/20">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <KeyRound className="size-4 text-primary" />
                                            Permiso
                                        </CardTitle>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Selecciona el permiso que
                                            controla este menú.
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                        {data.permission_id
                                            ? 'Seleccionado'
                                            : 'Sin seleccionar'}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 p-5">

                                <Input
                                    value={permissionSearch}
                                    onChange={(e) =>
                                        setPermissionSearch(
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Buscar permiso..."
                                />

                                <div className="grid gap-4 lg:grid-cols-2">
                                    {groupedPermissions.map((group) => {
                                        const isOpen =
                                            openGroups[group.name] ??
                                            true;

                                        return (
                                            <div
                                                key={group.name}
                                                className="overflow-hidden rounded-xl border"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleGroup(
                                                            group.name,
                                                        )
                                                    }
                                                    className="flex w-full items-center justify-between bg-muted/30 px-4 py-3 text-left hover:bg-muted/50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FolderTree className="size-4 text-primary" />

                                                        <span className="text-sm font-semibold capitalize">
                                                            {group.name}
                                                        </span>
                                                    </div>

                                                    <ChevronDown
                                                        className={`size-4 transition-transform ${
                                                            isOpen
                                                                ? 'rotate-180'
                                                                : ''
                                                        }`}
                                                    />
                                                </button>

                                                {isOpen && (
                                                    <div className="space-y-1 p-2">
                                                        {group.permissions.map(
                                                            (
                                                                permission,
                                                            ) => {
                                                                const selected =
                                                                    data.permission_id ===
                                                                    permission.id;

                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        key={
                                                                            permission.id
                                                                        }
                                                                        onClick={() =>
                                                                            setData(
                                                                                'permission_id',
                                                                                selected
                                                                                    ? null
                                                                                    : permission.id,
                                                                            )
                                                                        }
                                                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                                                            selected
                                                                                ? 'bg-primary/10 text-primary'
                                                                                : 'hover:bg-muted'
                                                                        }`}
                                                                    >
                                                                        <span className="truncate font-medium">
                                                                            {
                                                                                permission.name
                                                                            }
                                                                        </span>

                                                                        {selected && (
                                                                            <Check className="size-4 shrink-0" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {errors.permission_id && (
                                    <p className="text-xs text-destructive">
                                        {errors.permission_id}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ACCIONES */}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href="/security/menus">
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
                                : 'Guardar cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
