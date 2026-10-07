import { securityIconKeys, securityIcons } from '@/components/security/icon-map';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { SecurityMenu, SecurityMenuType } from '@/types';
import { useForm } from '@inertiajs/react';
import { Check, ChevronDown, FolderTree, KeyRound, Shapes } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

/* ---------------------------------------------------------------------------
   Tipos
--------------------------------------------------------------------------- */

interface Permission {
    id: number;
    name: string;
}

interface ParentOption {
    id: number;
    name: string;
    type: string;
    depth: number;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    menu?: SecurityMenu | null;
    defaultParentId?: number | null;
    defaultType?: SecurityMenuType;
    parentOptions: ParentOption[];
    permissions: Permission[];
    routeSuggestions: string[];
}

/* ---------------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------------- */

function slugify(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/* ---------------------------------------------------------------------------
   Componente principal
--------------------------------------------------------------------------- */

export function MenuFormSheet({
    open,
    onOpenChange,
    mode,
    menu,
    defaultParentId,
    defaultType,
    parentOptions = [],
    permissions = [],
    routeSuggestions = [],
}: Props) {
    const isEdit = mode === 'edit';

    const { data, setData, post, put, processing, errors } = useForm<{
        name: string;
        slug: string;
        route: string;
        icon: string;
        type: SecurityMenuType;
        parent_id: number | null;
        permission_id: number | null;
        is_active: boolean;
    }>({
        name: '',
        slug: '',
        route: '',
        icon: '',
        type: 'menu',
        parent_id: null,
        permission_id: null,
        is_active: true,
    });

    const [slugEdited, setSlugEdited] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    const [permSearch, setPermSearch] = useState('');

    /* Re-Establecer el formulario al abrir */
    useEffect(() => {
        if (!open) {
            return;
        }

        setData({
            name: menu?.name ?? '',
            slug: menu?.slug ?? '',
            route: menu?.route ?? '',
            icon: menu?.icon ?? '',
            type: menu?.type ?? defaultType ?? 'menu',
            parent_id: menu?.parent_id ?? defaultParentId ?? null,
            permission_id: menu?.permission_id ?? null,
            is_active: menu?.is_active ?? true,
        });
        setSlugEdited(Boolean(menu));
        setIconSearch('');
        setPermSearch('');
    }, [open, menu, defaultType, defaultParentId]);

    /* Auto-slug a partir del nombre */
    useEffect(() => {
        if (!slugEdited) {
            setData('slug', slugify(data.name));
        }
    }, [data.name, slugEdited]);
    /* Filtro de iconos */
    const filteredIcons = useMemo(() => {
        if (!iconSearch.trim()) {
            return securityIconKeys;
        }

        const value = iconSearch.toLowerCase();

        return securityIconKeys.filter((key) => key.includes(value));
    }, [iconSearch]);

    /* Permisos agrupados por categoría */
    const groupedPermissions = useMemo(() => {
        const groupsMap: Record<string, Permission[]> = {};

        permissions.forEach((permission) => {
            const category = permission.name.split('.')[0] || 'general';

            if (!groupsMap[category]) {
                groupsMap[category] = [];
            }

            groupsMap[category].push(permission);
        });

        return Object.entries(groupsMap)
            .map(([name, items]) => ({
                name,
                items: items.filter((permission) => !permSearch || permission.name.toLowerCase().includes(permSearch.toLowerCase())),
            }))
            .filter((group) => group.items.length > 0);
    }, [permissions, permSearch]);

    /* Sugerencias de rutas filtradas */
    const filteredRoutes = useMemo(() => {
        if (!data.route.trim()) {
            return routeSuggestions.slice(0, 12);
        }

        const value = data.route.toLowerCase();

        return routeSuggestions.filter((route) => route.toLowerCase().includes(value)).slice(0, 12);
    }, [routeSuggestions, data.route]);

    /* Envío */
    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (isEdit && menu) {
            put(`/menus/${menu.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        } else {
            post('/menus', {
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        }
    };

    const isSection = data.type === 'section';
    const isGroup = data.type === 'group';
    const isMenu = data.type === 'menu';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{isEdit ? 'Editar menú' : 'Nuevo menú'}</SheetTitle>

                    <SheetDescription>
                        {isEdit ? 'Modifica los datos del elemento seleccionado.' : 'Completa los datos para agregar un nuevo elemento al menú.'}
                    </SheetDescription>
                </SheetHeader>

                <form id="menu-form" onSubmit={submit} className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">
                    {/* TIPO */}
                    <div className="space-y-1.5">
                        <Label>Tipo</Label>

                        <div className="grid grid-cols-3 gap-1 rounded-lg border p-0.5">
                            {(
                                [
                                    { value: 'section', label: 'Sección', icon: FolderTree, desc: 'Encabezado' },
                                    { value: 'group', label: 'Grupo', icon: Shapes, desc: 'Carpeta' },
                                    { value: 'menu', label: 'Menú', icon: KeyRound, desc: 'Enlace' },
                                ] as const
                            ).map(({ value, label, icon: Icon, desc }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setData('type', value)}
                                    className={`flex flex-col items-center gap-1 rounded-md px-2 py-3 text-xs transition-colors ${
                                        data.type === value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    <Icon className="size-4" />

                                    <span className="font-medium">{label}</span>

                                    <span className="text-[10px] opacity-70">{desc}</span>
                                </button>
                            ))}
                        </div>

                        {errors.type && <p className="text-destructive text-xs">{errors.type}</p>}
                    </div>

                    {/* NOMBRE */}
                    <div className="space-y-1.5">
                        <Label htmlFor="menu-name">Nombre</Label>

                        <Input
                            id="menu-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ej: Usuarios"
                            autoFocus
                        />

                        {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                    </div>

                    {/* SLUG */}
                    <div className="space-y-1.5">
                        <Label htmlFor="menu-slug">Slug</Label>

                        <Input
                            id="menu-slug"
                            value={data.slug}
                            onChange={(e) => {
                                setData('slug', e.target.value);
                                setSlugEdited(true);
                            }}
                            placeholder="usuarios"
                        />

                        <p className="text-muted-foreground text-xs">Se genera automáticamente a partir del nombre.</p>

                        {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
                    </div>

                    {(isMenu || isGroup) && <Separator />}
                    {/* ICONO */}
                    {(isMenu || isGroup) && (
                        <div className="space-y-2">
                            <Label>Icono</Label>

                            <Input value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} placeholder="Buscar icono..." className="h-9" />

                            <div className="max-h-40 gap-1 overflow-y-auto pr-1">
                                <div className="grid grid-cols-7 gap-1">
                                    {filteredIcons.map((key) => {
                                        const IconComp = securityIcons[key];
                                        const selected = data.icon === key;

                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setData('icon', selected ? '' : key)}
                                                title={key}
                                                className={`flex size-9 items-center justify-center rounded-md border text-sm transition-colors ${
                                                    selected
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'
                                                }`}
                                            >
                                                <IconComp className="size-4" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {data.icon && (
                                <p className="text-muted-foreground text-xs">
                                    Seleccionado: <span className="font-medium">{data.icon}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* RUTA */}
                    {isMenu && (
                        <div className="space-y-2">
                            <Label htmlFor="menu-route">Ruta</Label>

                            <Input id="menu-route" value={data.route} onChange={(e) => setData('route', e.target.value)} placeholder="/usuarios" />

                            {filteredRoutes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {filteredRoutes.map((route) => (
                                        <button
                                            key={route}
                                            type="button"
                                            onClick={() => setData('route', route)}
                                            className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                                                data.route === route
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border-transparent'
                                            }`}
                                        >
                                            {route}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {errors.route && <p className="text-destructive text-xs">{errors.route}</p>}
                        </div>
                    )}
                    {/* PERMISO */}
                    {isMenu && (
                        <div className="space-y-2">
                            <Label>Permiso</Label>

                            <Input
                                value={permSearch}
                                onChange={(e) => setPermSearch(e.target.value)}
                                placeholder="Buscar permiso..."
                                className="h-9"
                            />

                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
                                <button
                                    type="button"
                                    onClick={() => setData('permission_id', null)}
                                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                        data.permission_id === null ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                    }`}
                                >
                                    <span className="text-muted-foreground italic">Sin permiso</span>

                                    {data.permission_id === null && <Check className="size-4 shrink-0" />}
                                </button>

                                {groupedPermissions.map((group) => (
                                    <PermissionGroup
                                        key={group.name}
                                        group={group}
                                        selectedId={data.permission_id}
                                        onSelect={(id) => setData('permission_id', data.permission_id === id ? null : id)}
                                    />
                                ))}
                            </div>

                            {errors.permission_id && <p className="text-destructive text-xs">{errors.permission_id}</p>}
                        </div>
                    )}
                    {/* ─── PADRE ─── */}
                    {!isSection && parentOptions.length > 0 && (
                        <div className="space-y-1.5">
                            <Label>Contenedor padre</Label>

                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
                                <button
                                    type="button"
                                    onClick={() => setData('parent_id', null)}
                                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                        data.parent_id === null ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                    }`}
                                >
                                    <span>Raíz (sin contenedor)</span>

                                    {data.parent_id === null && <Check className="size-4 shrink-0" />}
                                </button>

                                {parentOptions.map((opt) => {
                                    const isSelected = data.parent_id === opt.id;

                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setData('parent_id', opt.id)}
                                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                                isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                            }`}
                                            style={{ paddingLeft: `${12 + opt.depth * 20}px` }}
                                        >
                                            <span className="truncate">
                                                {opt.type === 'section' ? (
                                                    <FolderTree className="mr-1.5 inline size-3.5" />
                                                ) : (
                                                    <Shapes className="mr-1.5 inline size-3.5" />
                                                )}
                                                {opt.name}
                                            </span>

                                            {isSelected && <Check className="size-4 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {errors.parent_id && <p className="text-destructive text-xs">{errors.parent_id}</p>}
                        </div>
                    )}
                    {/* ACTIVO */}
                    <div className="flex items-center gap-3">
                        <Checkbox id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', !!checked)} />

                        <Label htmlFor="is_active" className="cursor-pointer font-medium">
                            Activo
                        </Label>
                    </div>
                </form>

                <SheetFooter className="border-t pt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>

                    <Button form="menu-form" type="submit" disabled={processing}>
                        {processing ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear menú'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

/* ---------------------------------------------------------------------------
   Grupo de permisos colapsable
--------------------------------------------------------------------------- */

function PermissionGroup({
    group,
    selectedId,
    onSelect,
}: {
    group: { name: string; items: Permission[] };
    selectedId: number | null;
    onSelect: (id: number) => void;
}) {
    const [open, setOpen] = useState(true);

    return (
        <div className="rounded-md">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="text-muted-foreground hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold capitalize"
            >
                <span>{group.name}</span>

                <ChevronDown className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="space-y-0.5 pl-1">
                    {group.items.map((permission) => {
                        const selected = selectedId === permission.id;

                        return (
                            <button
                                key={permission.id}
                                type="button"
                                onClick={() => onSelect(permission.id)}
                                className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                                    selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                                }`}
                            >
                                <span className="truncate">{permission.name}</span>

                                {selected && <Check className="size-3.5 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
