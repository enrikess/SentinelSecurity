import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { permissionGroupColors, type PermissionGroupColor } from '@/components/security/permission-group-colors';
import { ArrowLeft, Check, CheckCircle2, Loader2, Save, ShieldCheck, Tag } from 'lucide-react';

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
| Componente
|--------------------------------------------------------------------------
*/

export default function Create({ permissions = [] }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: [] as number[],
    });

    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    /*
    |--------------------------------------------------------------------------
    | Seleccionar permiso
    |--------------------------------------------------------------------------
    */

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions((current) => {
            let updated: number[];

            if (current.includes(permissionId)) {
                updated = current.filter((id) => id !== permissionId);
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

    const toggleGroup = (group: PermissionGroup) => {
        const ids = group.permissions.map((permission) => permission.id);

        const allSelected = ids.length > 0 && ids.every((id) => selectedPermissions.includes(id));

        setSelectedPermissions((current) => {
            let updated: number[];

            if (allSelected) {
                updated = current.filter((id) => !ids.includes(id));
            } else {
                updated = Array.from(new Set([...current, ...ids]));
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

    const totalPermissions = permissions.reduce((total, group) => total + group.permissions.length, 0);

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

            <form onSubmit={handleSubmit} className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
                {/* ======================================================
                    HEADER
                ====================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
                                <ShieldCheck className="text-primary size-5" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">Nuevo rol</h1>
                        </div>

                        <p className="text-muted-foreground mt-1 text-sm">Crea un rol y asigna los permisos correspondientes.</p>
                    </div>

                    <Button type="button" variant="outline" asChild>
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
                    <CardHeader className="bg-muted/20 border-b pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldCheck className="text-primary size-5" />
                            Información del rol
                        </CardTitle>

                        <CardDescription>Define el nombre del rol.</CardDescription>
                    </CardHeader>

                    <CardContent className="p-4">
                        <div className="max-w-xl space-y-2">
                            <Label htmlFor="name">Nombre</Label>

                            <div className="relative">
                                <Tag className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    placeholder="Ej. Administrador"
                                    autoFocus
                                    className="pl-9"
                                />
                            </div>

                            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* ======================================================
                    ENCABEZADO PERMISOS
                ====================================================== */}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold">Permisos</h2>

                        <p className="text-muted-foreground text-sm">Selecciona los permisos que tendrá este rol.</p>
                    </div>

                    <div className="bg-primary/10 text-primary inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
                        <CheckCircle2 className="size-3.5" />
                        {selectedPermissions.length} de {totalPermissions} seleccionados
                    </div>
                </div>

                {/* ======================================================
                    PERMISOS
                ====================================================== */}

                {permissions.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
                            <div className="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
                                <ShieldCheck className="text-muted-foreground size-5" />
                            </div>

                            <h3 className="font-medium">No hay permisos</h3>

                            <p className="text-muted-foreground mt-1 text-sm">No existen permisos registrados en el sistema.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                        {permissions.map((group, index) => (
                            <PermissionCard
                                key={group.name}
                                group={group}
                                color={permissionGroupColors[index % permissionGroupColors.length]}
                                selectedPermissions={selectedPermissions}
                                onTogglePermission={togglePermission}
                                onToggleGroup={toggleGroup}
                            />
                        ))}
                    </div>
                )}

                {errors.permissions && <p className="text-destructive text-sm">{errors.permissions}</p>}

                {/* ======================================================
                    FOOTER
                ====================================================== */}

                <Card className="bg-card/95 sticky bottom-4 z-10 border shadow-lg backdrop-blur-md">
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-medium">Selección:</span>

                            <Badge variant="outline" className="gap-1 font-semibold">
                                <CheckCircle2 className="text-primary size-3" />
                                {selectedPermissions.length} de {totalPermissions} seleccionados
                            </Badge>
                        </div>

                        <div className="flex shrink-0 flex-col-reverse gap-2.5 sm:flex-row">
                            <Button type="button" variant="outline" asChild>
                                <Link href="/roles">
                                    <ArrowLeft className="mr-2 size-4" />
                                    Cancelar
                                </Link>
                            </Button>

                            <Button type="submit" disabled={processing} className="font-semibold shadow-xs">
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 size-4" />
                                        Guardar rol
                                    </>
                                )}
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
    color: PermissionGroupColor;
    selectedPermissions: number[];
    onTogglePermission: (permissionId: number) => void;
    onToggleGroup: (group: PermissionGroup) => void;
}) {
    const permissionIds = group.permissions.map((permission) => permission.id);

    const selectedCount = permissionIds.filter((id) => selectedPermissions.includes(id)).length;

    const allSelected = permissionIds.length > 0 && selectedCount === permissionIds.length;

    return (
        <Card className="overflow-hidden">
            {/* ======================================================
                HEADER DE CATEGORÍA
            ====================================================== */}

            <CardHeader className={color.card}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color.icon}`}>
                            <ShieldCheck className="size-5" />
                        </div>

                        <div className="min-w-0">
                            <CardTitle className="truncate text-base capitalize">{group.name}</CardTitle>

                            <p className="text-muted-foreground mt-1 text-xs">
                                {selectedCount} de {group.permissions.length} seleccionados
                            </p>
                        </div>
                    </div>

                    {group.permissions.length > 0 && (
                        <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0 text-xs" onClick={() => onToggleGroup(group)}>
                            {allSelected ? 'Quitar todos' : 'Todos'}
                        </Button>
                    )}
                </div>
            </CardHeader>

            {/* ======================================================
                LISTADO
            ====================================================== */}

            <CardContent className="p-0">
                <div className="divide-y">
                    {group.permissions.map((permission) => {
                        const checked = selectedPermissions.includes(permission.id);

                        return (
                            <button
                                key={permission.id}
                                type="button"
                                onClick={() => onTogglePermission(permission.id)}
                                className="hover:bg-muted/50 flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div
                                        className={`flex size-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                                            checked ? color.icon : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {checked ? <Check className="size-4" /> : <ShieldCheck className="size-4" />}
                                    </div>

                                    <div className="min-w-0">
                                        <p className={`truncate text-sm ${checked ? 'font-medium' : 'text-muted-foreground'}`}>{permission.action}</p>

                                        <p className="text-muted-foreground truncate text-xs">{permission.name}</p>
                                    </div>
                                </div>

                                {/* CHECKBOX */}

                                <div
                                    className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'
                                    }`}
                                >
                                    {checked && <Check className="size-3.5" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
