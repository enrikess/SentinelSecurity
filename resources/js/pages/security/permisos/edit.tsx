import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    ArrowLeft,
    KeyRound,
    Save,
} from 'lucide-react';

interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

interface Props {
    permission: Permission;
}

export default function Edit({ permission }: Props) {
    const { data, setData, put, processing, errors } =
        useForm({
            name: permission.name,
            guard_name: permission.guard_name,
        });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/permisos/${permission.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Permisos',
                    href: '/permisos',
                },
                {
                    title: 'Editar permiso',
                    href: `/permisos/${permission.id}/edit`,
                },
            ]}
        >
            <Head title="Editar permiso" />

            <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                    <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="size-9"
                    >
                        <Link href="/permisos">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>

                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                                <KeyRound className="size-5 text-primary" />
                            </div>

                            <h1 className="text-xl font-semibold tracking-tight">
                                Editar permiso
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Modifica la información del permiso.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Información del permiso
                        </CardTitle>

                        <CardDescription>
                            Actualiza los datos del permiso.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form
                            onSubmit={submit}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nombre del permiso
                                </Label>

                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="usuarios.listar"
                                    autoFocus
                                />

                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Formato:
                                    <span className="mx-1 font-medium">
                                        grupo.accion
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guard_name">
                                    Guard
                                </Label>

                                <Input
                                    id="guard_name"
                                    value={data.guard_name}
                                    onChange={(e) =>
                                        setData(
                                            'guard_name',
                                            e.target.value,
                                        )
                                    }
                                />

                                {errors.guard_name && (
                                    <p className="text-sm text-destructive">
                                        {errors.guard_name}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 border-t pt-5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                >
                                    <Link href="/permisos">
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
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
