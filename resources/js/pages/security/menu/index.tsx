import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { securityIcons } from '@/components/security/icon-map';
import type { SecurityMenu, SecurityMenuType } from '@/types';

import { ChevronDown, ChevronRight, ChevronUp, CircleDot, FolderTree, Menu as MenuIcon, Pencil, Plus, Search, Shapes, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { MenuFormSheet } from './menu-form-sheet';

interface ParentOption {
    id: number;
    name: string;
    type: string;
    depth: number;
}

interface SheetState {
    open: boolean;
    mode: 'create' | 'edit';
    menu: SecurityMenu | null;
    parentId: number | null;
    defaultType: SecurityMenuType;
}

interface Props {
    menus: SecurityMenu[];
    permissions: { id: number; name: string }[];
    routeSuggestions: string[];
}

export default function Index({ menus = [], permissions = [], routeSuggestions = [] }: Props) {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [sheet, setSheet] = useState<SheetState>({
        open: false,
        mode: 'create',
        menu: null,
        parentId: null,
        defaultType: 'menu',
    });

    const toggleExpanded = (id: number) => {
        setExpanded((current) => ({
            ...current,
            [id]: !current[id],
        }));
    };

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

    const collapseAll = () => {
        setExpanded({});
    };

    const filteredMenus = useMemo(() => {
        const value = search.toLowerCase().trim();

        if (!value) {
            return menus;
        }

        const filterTree = (items: SecurityMenu[]): SecurityMenu[] => {
            return items.reduce<SecurityMenu[]>((result, item) => {
                const children = item.children ? filterTree(item.children) : [];

                const matches = item.name?.toLowerCase().includes(value) || item.route?.toLowerCase().includes(value);

                if (matches || children.length > 0) {
                    result.push({ ...item, children });
                }

                return result;
            }, []);
        };

        return filterTree(menus);
    }, [menus, search]);

    const parentOptions = useMemo<ParentOption[]>(() => {
        const options: ParentOption[] = [];

        const walk = (items: SecurityMenu[], depth: number) => {
            items.forEach((item) => {
                if (item.type === 'section' || item.type === 'group') {
                    options.push({
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        depth,
                    });
                }
                if (item.children?.length) {
                    walk(item.children, depth + 1);
                }
            });
        };

        walk(menus, 0);
        return options;
    }, [menus]);
    /* ── Abrir formulario ─────────────────────────────────────────────────── */

    const openCreate = (parent?: SecurityMenu | null) => {
        setSheet({
            open: true,
            mode: 'create',
            menu: null,
            parentId: parent?.id ?? null,
            defaultType: parent ? 'menu' : 'group',
        });
    };

    const openNewSection = () => {
        setSheet({
            open: true,
            mode: 'create',
            menu: null,
            parentId: null,
            defaultType: 'section',
        });
    };

    const openEdit = (menu: SecurityMenu) => {
        setSheet({
            open: true,
            mode: 'edit',
            menu,
            parentId: menu.parent_id,
            defaultType: menu.type,
        });
    };

    /* ── Mover ───────────────────────────────────────────────────────────── */

    const handleMove = (menu: SecurityMenu, direction: 'up' | 'down') => {
        router.patch(
            `/menus/${menu.id}/move`,
            { direction },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Orden actualizado correctamente.');
                },
                onError: (errors) => {
                    toast.error(errors.move ?? 'No se pudo reordenar el menú.');
                },
            },
        );
    };

    /* ── Eliminar ────────────────────────────────────────────────────────── */

    const handleDelete = (menu: SecurityMenu) => {
        const confirmed = window.confirm(`¿Deseas eliminar el menú "${menu.name}"?`);

        if (!confirmed) {
            return;
        }

        router.delete(`/menus/${menu.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Menú eliminado', {
                    description: `${menu.name} fue eliminado correctamente.`,
                });
            },
            onError: (errors) => {
                toast.error(errors.delete ?? 'No se pudo eliminar el menú.');
            },
        });
    };
    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Menús',
                    href: '/menus',
                },
            ]}
        >
            <Head title="Menús" />

            <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
                {/* HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
                                <MenuIcon className="text-primary size-5" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">Menús</h1>
                        </div>

                        <p className="text-muted-foreground mt-1 text-sm">Agrega, edita y ordena los elementos de la navegación del sistema.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={openNewSection}>
                            <Plus className="mr-2 size-4" />
                            Nueva sección
                        </Button>

                        <Button type="button" onClick={() => openCreate(null)}>
                            <Shapes className="mr-2 size-4" />
                            Nuevo grupo
                        </Button>
                    </div>
                </div>
                {/* ÁRBOL */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle className="text-base">Estructura del menú</CardTitle>

                                <p className="text-muted-foreground mt-1 text-xs">
                                    Usa <Plus className="inline size-3" /> en una sección o grupo para agregar un ítem hijo.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="relative w-full sm:w-64">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar menú..." className="pl-9" />
                                </div>

                                <Button type="button" variant="outline" size="sm" onClick={expandAll}>
                                    Expandir
                                </Button>

                                <Button type="button" variant="outline" size="sm" onClick={collapseAll}>
                                    Contraer
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {filteredMenus.length === 0 ? (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
                                    <FolderTree className="text-muted-foreground size-5" />
                                </div>

                                <h3 className="font-medium">No se encontraron menús</h3>

                                <p className="text-muted-foreground mt-1 text-sm">No existen elementos que coincidan con la búsqueda.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredMenus.map((menu) => (
                                    <MenuTreeNode
                                        key={menu.id}
                                        menu={menu}
                                        level={0}
                                        expanded={expanded}
                                        onToggle={toggleExpanded}
                                        onAddChild={openCreate}
                                        onEdit={openEdit}
                                        onMove={handleMove}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* FORMULARIO (create / edit) */}
            <MenuFormSheet
                open={sheet.open}
                onOpenChange={(open) => setSheet((current) => ({ ...current, open }))}
                mode={sheet.mode}
                menu={sheet.mode === 'edit' ? sheet.menu : null}
                defaultParentId={sheet.mode === 'create' ? sheet.parentId : null}
                defaultType={sheet.defaultType}
                parentOptions={parentOptions}
                permissions={permissions}
                routeSuggestions={routeSuggestions}
            />
        </AppLayout>
    );
}
/* ---------------------------------------------------------------------------
   Etiqueta de tipo
--------------------------------------------------------------------------- */

const typeLabels: Record<string, string> = {
    section: 'SECCIÓN',
    group: 'GRUPO',
    menu: 'MENÚ',
};

/* ---------------------------------------------------------------------------
   Elemento del árbol
--------------------------------------------------------------------------- */

function MenuTreeNode({
    menu,
    level,
    expanded,
    onToggle,
    onAddChild,
    onEdit,
    onMove,
    onDelete,
}: {
    menu: SecurityMenu;
    level: number;
    expanded: Record<number, boolean>;
    onToggle: (id: number) => void;
    onAddChild: (parent?: SecurityMenu | null) => void;
    onEdit: (menu: SecurityMenu) => void;
    onMove: (menu: SecurityMenu, direction: 'up' | 'down') => void;
    onDelete: (menu: SecurityMenu) => void;
}) {
    const hasChildren = Array.isArray(menu.children) && menu.children.length > 0;
    const isExpanded = expanded[menu.id] ?? false;

    const Icon = menu.icon ? securityIcons[menu.icon as keyof typeof securityIcons] : null;

    const typeClass =
        menu.type === 'section'
            ? 'bg-muted text-muted-foreground'
            : menu.type === 'group'
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground';

    return (
        <div>
            <div
                className="group hover:bg-muted/40 flex min-h-14 items-center gap-2 border-b px-3 py-2 transition-colors"
                style={{ paddingLeft: `${12 + level * 28}px` }}
            >
                {/* Expandir */}
                <div className="flex size-7 shrink-0 items-center justify-center">
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => onToggle(menu.id)}
                            className="hover:bg-muted flex size-7 items-center justify-center rounded-md"
                        >
                            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                    ) : (
                        <CircleDot className="text-muted-foreground size-2" />
                    )}
                </div>

                {/* Icono */}
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${typeClass}`}>
                    {Icon ? (
                        <Icon className="size-4" />
                    ) : menu.type === 'section' ? (
                        <FolderTree className="size-4" />
                    ) : menu.type === 'group' ? (
                        <Shapes className="size-4" />
                    ) : (
                        <MenuIcon className="size-4" />
                    )}
                </div>

                {/* Información */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{menu.name || 'Sin nombre'}</p>

                        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
                            {typeLabels[menu.type] ?? 'MENÚ'}
                        </span>
                    </div>

                    {menu.route && <p className="text-muted-foreground truncate text-xs">{menu.route}</p>}
                </div>
                {/* Estado */}
                <div className="hidden shrink-0 sm:block">
                    {menu.is_active === false ? (
                        <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs">Inactivo</span>
                    ) : (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Activo
                        </span>
                    )}
                </div>

                {/* Acciones */}
                <div className="flex shrink-0 items-center gap-0.5">
                    {menu.type !== 'menu' && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title={`Agregar hijo a ${menu.name}`}
                            onClick={() => onAddChild(menu)}
                        >
                            <Plus className="size-4" />
                            <span className="sr-only">Agregar hijo</span>
                        </Button>
                    )}

                    <Button type="button" variant="ghost" size="icon" className="size-8" title="Subir" onClick={() => onMove(menu, 'up')}>
                        <ChevronUp className="size-4" />
                        <span className="sr-only">Subir</span>
                    </Button>

                    <Button type="button" variant="ghost" size="icon" className="size-8" title="Bajar" onClick={() => onMove(menu, 'down')}>
                        <ChevronDown className="size-4" />
                        <span className="sr-only">Bajar</span>
                    </Button>

                    <Button type="button" variant="ghost" size="icon" className="size-8" title="Editar" onClick={() => onEdit(menu)}>
                        <Pencil className="size-4" />
                        <span className="sr-only">Editar</span>
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive size-8"
                        title="Eliminar"
                        onClick={() => onDelete(menu)}
                    >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Eliminar</span>
                    </Button>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {menu.children!.map((child) => (
                        <MenuTreeNode
                            key={child.id}
                            menu={child}
                            level={level + 1}
                            expanded={expanded}
                            onToggle={onToggle}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onMove={onMove}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
