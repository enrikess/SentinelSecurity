import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

import {
    ArrowLeft,
    Check,
    KeyRound,
    Shield,
} from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    action: string;
}

interface PermissionGroup {
    name: string;
    permissions: Permission[];
}

interface Role {
    id: number;
    name: string;
    permissions: number[];
}

interface Props {
    role: Role;
    permissions: PermissionGroup[];
}

interface RoleForm {
    name: string;
    permissions: number[];
    [key: string]: any;
}

export default function Edit({
    role,
    permissions,
}: Props) {
    const {
        data,
        setData,
        put,
        processing,
        errors,
    } = useForm<RoleForm>({
        name: role.name,
        permissions: role.permissions,
    });

    const togglePermission = (
        permissionId: number,
        checked: boolean
    ) => {
        if (checked) {
            setData('permissions', [
                ...data.permissions,
                permissionId,
            ]);

            return;
        }

        setData(
            'permissions',
            data.permissions.filter(
                (id) => id !== permissionId
            )
        );
    };

    const toggleGroup = (
        groupPermissions: Permission[],
        checked: boolean
    ) => {
        const ids = groupPermissions.map(
            (permission) => permission.id
        );

        if (checked) {
            setData(
                'permissions',
                Array.from(
                    new Set([
                        ...data.permissions,
                        ...ids,
                    ])
                )
            );

            return;
        }

        setData(
            'permissions',
            data.permissions.filter(
                (id) => !ids.includes(id)
            )
        );
    };

    const isGroupChecked = (
        groupPermissions: Permission[]
    ) => {
        return (
            groupPermissions.length > 0 &&
            groupPermissions.every((permission) =>
                data.permissions.includes(permission.id)
            )
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/roles/${role.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Roles',
                    href: '/roles',
                },
                {
                    title: 'Editar rol',
                    href: `/roles/${role.id}/edit`,
                },
            ]}
        >
            <Head title={`Editar ${role.name}`} />

            <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
                <form
                    onSubmit={submit}
                    className="space-y-6"
                >
                    {/* Información */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Shield className="size-5" />
                                Información del rol
                            </CardTitle>
                        </CardHeader>

                        <CardContent>
                            <div className="max-w-xl space-y-2">
                                <Label htmlFor="name">
                                    Nombre del rol
                                </Label>

                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData(
                                            'name',
                                            e.target.value
                                        )
                                    }
                                    placeholder="Ej. Administrador"
                                />

                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permisos */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <KeyRound className="size-5" />
                                        Permisos
                                    </CardTitle>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Administra los permisos asignados
                                        al rol.
                                    </p>
                                </div>

                                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                    {data.permissions.length} seleccionados
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {permissions.map(
                                (group, index) => (
                                    <div
                                        key={group.name}
                                        className="space-y-3"
                                    >
                                        {index > 0 && (
                                            <Separator />
                                        )}

                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-sm font-semibold capitalize">
                                                    {group.name}
                                                </h3>

                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        group.permissions
                                                            .length
                                                    }{' '}
                                                    permisos
                                                </p>
                                            </div>

                                            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                                                <Checkbox
                                                    checked={isGroupChecked(
                                                        group.permissions
                                                    )}
                                                    onCheckedChange={(
                                                        checked
                                                    ) =>
                                                        toggleGroup(
                                                            group.permissions,
                                                            checked === true
                                                        )
                                                    }
                                                />

                                                Todo
                                            </label>
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                            {group.permissions.map(
                                                (permission) => (
                                                    <label
                                                        key={
                                                            permission.id
                                                        }
                                                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                                    >
                                                        <Checkbox
                                                            checked={data.permissions.includes(
                                                                permission.id
                                                            )}
                                                            onCheckedChange={(
                                                                checked
                                                            ) =>
                                                                togglePermission(
                                                                    permission.id,
                                                                    checked ===
                                                                        true
                                                                )
                                                            }
                                                        />

                                                        <span className="text-sm">
                                                            {
                                                                permission.action
                                                            }
                                                        </span>
                                                    </label>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Botones */}
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href="/roles">
                                <ArrowLeft className="mr-2 size-4" />
                                Cancelar
                            </Link>
                        </Button>

                        <Button
                            type="submit"
                            disabled={processing}
                        >
                            <Check className="mr-2 size-4" />

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
