import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import {
    ChevronDown,
    ChevronRight,
    GripVertical,
    Menu as MenuIcon,
    Pencil,
    Plus,
    Search,
    Trash2,
    CircleDot,
    FolderTree,
} from 'lucide-react';

import { toast } from 'sonner';

/*
|--------------------------------------------------------------------------
| Tipos
|--------------------------------------------------------------------------
*/

interface SecurityMenu {
    id: number;
    name: string;
    type?: string | null;
    route?: string | null;
    icon?: string | null;
    is_active?: boolean;
    sort_order?: number;
    parent_id?: number | null;
    children?: SecurityMenu[];
}

interface Props {
    menus: SecurityMenu[];
}

/*
|--------------------------------------------------------------------------
| Componente principal
|--------------------------------------------------------------------------
*/

export default function Index({ menus = [] }: Props) {
    const [search, setSearch] = useState('');

    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    /*
    |--------------------------------------------------------------------------
    | Expandir / contraer
    |--------------------------------------------------------------------------
    */

    const toggleExpanded = (id: number) => {
        setExpanded((current) => ({
            ...current,
            [id]: !current[id],
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Expandir todo
    |--------------------------------------------------------------------------
    */

    const expandAll = () => {
        const state: Record<number, boolean> = {};

        const walk = (items: SecurityMenu[]) => {
            items.forEach((item) => {
                state[item.id] = true;

                if (item.children?.length) {
                    walk(item.children);
                }
            });
        };

        walk(menus);

        setExpanded(state);
    };

    /*
    |--------------------------------------------------------------------------
    | Contraer todo
    |--------------------------------------------------------------------------
    */

    const collapseAll = () => {
        setExpanded({});
    };

    /*
    |--------------------------------------------------------------------------
    | Buscar
    |--------------------------------------------------------------------------
    */

    const filteredMenus = useMemo(() => {
        const value = search.toLowerCase().trim();

        if (!value) {
            return menus;
        }

        const filterTree = (
            items: SecurityMenu[]
        ): SecurityMenu[] => {
            return items.reduce<SecurityMenu[]>((result, item) => {
                const children = item.children
                    ? filterTree(item.children)
                    : [];

                const matches =
                    item.name?.toLowerCase().includes(value) ||
                    item.route?.toLowerCase().includes(value);

                if (matches || children.length > 0) {
                    result.push({
                        ...item,
                        children,
                    });
                }

                return result;
            }, []);
        };

        return filterTree(menus);
    }, [menus, search]);

    /*
    |--------------------------------------------------------------------------
    | Eliminar
    |--------------------------------------------------------------------------
    */

    const handleDelete = (menu: SecurityMenu) => {
        const confirmed = window.confirm(
            `¿Deseas eliminar el menú "${menu.name}"?`
        );

        if (!confirmed) {
            return;
        }

        router.delete(`/security/menus/${menu.id}`, {
            preserveScroll: true,

            onSuccess: () => {
                toast.success('Menú eliminado', {
                    description: `${menu.name} fue eliminado correctamente.`,
                });
            },

            onError: () => {
                toast.error('No se pudo eliminar el menú');
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Menús',
                    href: '/security/menus',
                },
            ]}
        >
            <Head title="Menús" />

            <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">

                {/* ==========================================================
                    HEADER
                ========================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <div className="flex items-center gap-2">

                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                <MenuIcon className="size-5 text-primary" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">
                                Menús
                            </h1>

                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Organiza la navegación del sistema.
                        </p>
                    </div>

                    <Button asChild>
                        <Link href="/security/menus/create">
                            <Plus className="mr-2 size-4" />
                            Nuevo menú
                        </Link>
                    </Button>

                </div>

                {/* ==========================================================
                    ÁRBOL
                ========================================================== */}

                <Card className="overflow-hidden">

                    <CardHeader className="border-b bg-muted/20">

                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                            <div>
                                <CardTitle className="text-base">
                                    Estructura del menú
                                </CardTitle>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    Arrastra los elementos para organizar
                                    posteriormente la jerarquía.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">

                                <div className="relative w-full sm:w-64">

                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                                    <Input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Buscar menú..."
                                        className="pl-9"
                                    />

                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={expandAll}
                                >
                                    Expandir
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={collapseAll}
                                >
                                    Contraer
                                </Button>

                            </div>

                        </div>

                    </CardHeader>

                    <CardContent className="p-0">

                        {filteredMenus.length === 0 ? (

                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                                    <FolderTree className="size-5 text-muted-foreground" />
                                </div>

                                <h3 className="font-medium">
                                    No se encontraron menús
                                </h3>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    No existen elementos que coincidan con la búsqueda.
                                </p>

                            </div>

                        ) : (

                            <div className="divide-y">

                                {filteredMenus.map((menu) => (
                                    <MenuTreeItem
                                        key={menu.id}
                                        menu={menu}
                                        level={0}
                                        expanded={expanded}
                                        onToggle={toggleExpanded}
                                        onDelete={handleDelete}
                                    />
                                ))}

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
| Elemento del árbol
|--------------------------------------------------------------------------
*/

function MenuTreeItem({
    menu,
    level,
    expanded,
    onToggle,
    onDelete,
}: {
    menu: SecurityMenu;
    level: number;
    expanded: Record<number, boolean>;
    onToggle: (id: number) => void;
    onDelete: (menu: SecurityMenu) => void;
}) {
    const hasChildren =
        Array.isArray(menu.children) &&
        menu.children.length > 0;

    const isExpanded = expanded[menu.id] ?? false;

    const isGroup =
        menu.type === 'GROUP' ||
        hasChildren;

    return (
        <div>

            {/* ==============================================================
                FILA
            ============================================================== */}

            <div
                className="
                    group
                    flex
                    min-h-14
                    items-center
                    gap-2
                    border-b
                    px-3
                    py-2
                    transition-colors
                    hover:bg-muted/40
                "
                style={{
                    paddingLeft: `${12 + level * 28}px`,
                }}
            >

                {/* Drag handle */}

                <button
                    type="button"
                    className="
                        cursor-grab
                        rounded
                        p-1
                        text-muted-foreground
                        opacity-0
                        transition-opacity
                        hover:bg-muted
                        group-hover:opacity-100
                    "
                    title="Mover menú"
                >
                    <GripVertical className="size-4" />
                </button>

                {/* Expandir */}

                <div className="flex size-7 shrink-0 items-center justify-center">

                    {hasChildren ? (

                        <button
                            type="button"
                            onClick={() => onToggle(menu.id)}
                            className="
                                flex
                                size-7
                                items-center
                                justify-center
                                rounded-md
                                hover:bg-muted
                            "
                        >
                            {isExpanded ? (
                                <ChevronDown className="size-4" />
                            ) : (
                                <ChevronRight className="size-4" />
                            )}
                        </button>

                    ) : (
                        <CircleDot className="size-2 text-muted-foreground" />
                    )}

                </div>

                {/* Icono */}

                <div
                    className={`
                        flex
                        size-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        ${
                            isGroup
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                        }
                    `}
                >
                    {menu.icon ? (
                        <span className="text-sm">
                            {menu.icon}
                        </span>
                    ) : (
                        <MenuIcon className="size-4" />
                    )}
                </div>

                {/* Información */}

                <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-2">

                        <p className="truncate text-sm font-medium">
                            {menu.name || 'Sin nombre'}
                        </p>

                        {isGroup && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                GRUPO
                            </span>
                        )}

                    </div>

                    <div className="flex items-center gap-2">

                        {menu.route && (
                            <p className="truncate text-xs text-muted-foreground">
                                {menu.route}
                            </p>
                        )}

                    </div>

                </div>

                {/* Estado */}

                <div className="hidden shrink-0 sm:block">

                    {menu.is_active === false ? (

                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                            Inactivo
                        </span>

                    ) : (

                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Activo
                        </span>

                    )}

                </div>

                {/* Acciones */}

                <div className="flex shrink-0 items-center gap-1">

                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="Editar menú"
                    >
                        <Link
                            href={`/security/menus/${menu.id}/edit`}
                        >
                            <Pencil className="size-4" />

                            <span className="sr-only">
                                Editar menú
                            </span>
                        </Link>
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="
                            size-8
                            text-muted-foreground
                            hover:bg-destructive/10
                            hover:text-destructive
                        "
                        title="Eliminar menú"
                        onClick={() => onDelete(menu)}
                    >
                        <Trash2 className="size-4" />

                        <span className="sr-only">
                            Eliminar menú
                        </span>
                    </Button>

                </div>

            </div>

            {/* ==============================================================
                HIJOS
            ============================================================== */}

            {hasChildren && isExpanded && (

                <div>

                    {menu.children!.map((child) => (

                        <MenuTreeItem
                            key={child.id}
                            menu={child}
                            level={level + 1}
                            expanded={expanded}
                            onToggle={onToggle}
                            onDelete={onDelete}
                        />

                    ))}

                </div>

            )}

        </div>
    );
}
