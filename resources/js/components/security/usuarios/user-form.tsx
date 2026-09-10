import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface UserFormProps {
    mode: 'create' | 'edit';
    user?: User;
}

export default function UserForm({
    mode,
    user,
}: UserFormProps) {
    const isEdit = mode === 'edit';

    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (isEdit && user) {
            form.put(`/usuarios/${user.id}`);
            return;
        }

        form.post('/usuarios');
    };
    console.log(form.data);
    console.log(user);
    return (
        <form
            onSubmit={submit}
            className="space-y-6"
        >
            {/* Nombre */}
            <div className="space-y-2">
                <Label htmlFor="name">
                    Nombre
                </Label>

                <Input
                    id="name"
                    type="text"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData(
                            'name',
                            event.target.value,
                        )
                    }
                    placeholder="Ingrese el nombre"
                    autoComplete="name"
                />

                {form.errors.name && (
                    <p className="text-sm text-destructive">
                        {form.errors.name}
                    </p>
                )}
            </div>

            {/* Correo */}
            <div className="space-y-2">
                <Label htmlFor="email">
                    Correo electrónico
                </Label>

                <Input
                    id="email"
                    type="email"
                    value={form.data.email}
                    onChange={(event) =>
                        form.setData(
                            'email',
                            event.target.value,
                        )
                    }
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                />

                {form.errors.email && (
                    <p className="text-sm text-destructive">
                        {form.errors.email}
                    </p>
                )}
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
                <Label htmlFor="password">
                    Contraseña
                </Label>

                <Input
                    id="password"
                    type="password"
                    value={form.data.password}
                    onChange={(event) =>
                        form.setData(
                            'password',
                            event.target.value,
                        )
                    }
                    placeholder={
                        isEdit
                            ? 'Dejar vacío para no cambiar'
                            : 'Ingrese la contraseña'
                    }
                    autoComplete={
                        isEdit
                            ? 'new-password'
                            : 'new-password'
                    }
                />

                {form.errors.password && (
                    <p className="text-sm text-destructive">
                        {form.errors.password}
                    </p>
                )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-2">
                <Label htmlFor="password_confirmation">
                    Confirmar contraseña
                </Label>

                <Input
                    id="password_confirmation"
                    type="password"
                    value={form.data.password_confirmation}
                    onChange={(event) =>
                        form.setData(
                            'password_confirmation',
                            event.target.value,
                        )
                    }
                    placeholder="Repita la contraseña"
                    autoComplete="new-password"
                />

                {form.errors.password_confirmation && (
                    <p className="text-sm text-destructive">
                        {form.errors.password_confirmation}
                    </p>
                )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                >
                    Cancelar
                </Button>

                <Button
                    type="submit"
                    disabled={form.processing}
                >
                    {form.processing && (
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                    )}

                    {isEdit
                        ? 'Actualizar usuario'
                        : 'Crear usuario'}
                </Button>
            </div>
        </form>
    );
}
