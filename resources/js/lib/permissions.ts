import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

export function can(permission: string): boolean {
    const { security } = usePage<SharedData>().props;

    return security.permissions.includes(permission);
}
