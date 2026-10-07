/*
|--------------------------------------------------------------------------
| Paleta de colores para tarjetas de grupos de permisos
|--------------------------------------------------------------------------
|
| Misma paleta que se usa en el formulario de roles. Se rota por cada
| grupo para dar variedad visual sin importar el orden de los módulos.
*/

export interface PermissionGroupColor {
    card: string;
    icon: string;
    selected: string;
}

export const permissionGroupColors: PermissionGroupColor[] = [
    {
        card: 'bg-blue-50/60 dark:bg-blue-950/20',
        icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
        selected: 'border-blue-500/50 bg-blue-500/5 ring-blue-500/20 dark:border-blue-400/50 dark:bg-blue-950/20',
    },
    {
        card: 'bg-emerald-50/60 dark:bg-emerald-950/20',
        icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
        selected: 'border-emerald-500/50 bg-emerald-500/5 ring-emerald-500/20 dark:border-emerald-400/50 dark:bg-emerald-950/20',
    },
    {
        card: 'bg-violet-50/60 dark:bg-violet-950/20',
        icon: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
        selected: 'border-violet-500/50 bg-violet-500/5 ring-violet-500/20 dark:border-violet-400/50 dark:bg-violet-950/20',
    },
    {
        card: 'bg-orange-50/60 dark:bg-orange-950/20',
        icon: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
        selected: 'border-orange-500/50 bg-orange-500/5 ring-orange-500/20 dark:border-orange-400/50 dark:bg-orange-950/20',
    },
    {
        card: 'bg-pink-50/60 dark:bg-pink-950/20',
        icon: 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',
        selected: 'border-pink-500/50 bg-pink-500/5 ring-pink-500/20 dark:border-pink-400/50 dark:bg-pink-950/20',
    },
    {
        card: 'bg-amber-50/60 dark:bg-amber-950/20',
        icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        selected: 'border-amber-500/50 bg-amber-500/5 ring-amber-500/20 dark:border-amber-400/50 dark:bg-amber-950/20',
    },
];
