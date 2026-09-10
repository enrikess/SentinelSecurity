import { cn } from '@/lib/utils';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type PermissionStatus = 'allow' | 'deny' | 'none';

interface TriStateCheckboxProps {
    status: PermissionStatus;
    onChange: (nextStatus: PermissionStatus) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Checkbox tri-estado (+, -, vacío) con microinteracciones y feedback visual.
 */
export function TriStateCheckbox({ status, onChange, className, size = 'md' }: TriStateCheckboxProps) {
    const cycleNext = () => {
        if (status === 'none') {
            onChange('allow');
        } else if (status === 'allow') {
            onChange('deny');
        } else {
            onChange('none');
        }
    };

    const sizeClasses = size === 'sm' ? 'size-4.5 rounded text-[10px]' : size === 'lg' ? 'size-6 rounded-md text-sm' : 'size-5 rounded-md text-xs';
    const iconClasses = size === 'sm' ? 'size-3 stroke-[3]' : size === 'lg' ? 'size-4 stroke-[3]' : 'size-3.5 stroke-[3]';

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={status === 'allow' ? true : status === 'deny' ? 'mixed' : false}
            aria-label={`Permiso: ${status === 'allow' ? 'Permitir (+)' : status === 'deny' ? 'Denegar (-)' : 'Vacío'}`}
            onClick={(e) => {
                e.stopPropagation();
                cycleNext();
            }}
            className={cn(
                sizeClasses,
                'relative flex items-center justify-center border font-bold transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none cursor-pointer shrink-0 hover:scale-105 active:scale-95 shadow-2xs',
                status === 'none' &&
                    'border-muted-foreground/30 bg-background hover:bg-muted/60 hover:border-primary/50 text-transparent',
                status === 'allow' &&
                    'border-emerald-600 bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700 hover:border-emerald-700',
                status === 'deny' &&
                    'border-rose-600 bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-700 hover:border-rose-700',
                className,
            )}
        >
            {status === 'allow' && <Plus className={iconClasses} />}
            {status === 'deny' && <Minus className={iconClasses} />}
        </button>
    );
}
interface PermissionStatusBadgeProps {
    status: PermissionStatus;
    className?: string;
}

/**
 * Mini badge que indica el estado del permiso a la derecha de la fila.
 */
export function PermissionStatusBadge({ status, className }: PermissionStatusBadgeProps) {
    if (status === 'allow') {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs',
                    className,
                )}
            >
                <Plus className="size-2.5 stroke-[3]" />
                Permitido
            </span>
        );
    }

    if (status === 'deny') {
        return (
            <span
                className={cn(
                    'inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 shadow-2xs',
                    className,
                )}
            >
                <Minus className="size-2.5 stroke-[3]" />
                Denegado
            </span>
        );
    }

    return (
        <span
            className={cn(
                'hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground/50',
                className,
            )}
        >
            Heredado
        </span>
    );
}



interface TriStateLegendProps {
    allowedCount?: number;
    deniedCount?: number;
    noneCount?: number;
    onAllowAll?: () => void;
    onDenyAll?: () => void;
    onResetAll?: () => void;
}

/**
 * Barra interactiva de estados y contadores de permisos.
 */
export function TriStateLegend({
    allowedCount,
    deniedCount,
    noneCount,
    onAllowAll,
    onDenyAll,
    onResetAll,
}: TriStateLegendProps) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                <span className="font-semibold text-foreground text-xs mr-1">Estados:</span>

                <div className="inline-flex items-center gap-1.5 rounded-lg border bg-background/90 px-2.5 py-1 text-muted-foreground shadow-2xs">
                    <span className="flex size-4 items-center justify-center rounded border border-input bg-muted/40 text-[10px] font-bold text-muted-foreground">
                        ∅
                    </span>
                    <span className="font-medium text-foreground">Heredado</span>
                    {typeof noneCount === 'number' && (
                        <span className="ml-1 rounded bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                            {noneCount}
                        </span>
                    )}
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1 text-emerald-800 dark:text-emerald-300 shadow-2xs">
                    <span className="flex size-4 items-center justify-center rounded bg-emerald-600 text-[10px] font-bold text-white">
                        +
                    </span>
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200">Permitido</span>
                    {typeof allowedCount === 'number' && (
                        <span className="ml-1 rounded bg-emerald-600/15 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {allowedCount}
                        </span>
                    )}
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/5 px-2.5 py-1 text-rose-800 dark:text-rose-300 shadow-2xs">
                    <span className="flex size-4 items-center justify-center rounded bg-rose-600 text-[10px] font-bold text-white">
                        -
                    </span>
                    <span className="font-semibold text-rose-900 dark:text-rose-200">Denegado</span>
                    {typeof deniedCount === 'number' && (
                        <span className="ml-1 rounded bg-rose-600/15 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                            {deniedCount}
                        </span>
                    )}
                </div>
            </div>

            {(onAllowAll || onDenyAll || onResetAll) && (
                <div className="flex items-center gap-1.5 sm:self-auto self-end shrink-0">
                    {onAllowAll && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onAllowAll}
                            className="h-7 px-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-800 dark:hover:bg-emerald-950/40 border-emerald-500/30"
                        >
                            <Plus className="mr-1 size-3 stroke-[3]" />
                            <span className="hidden sm:inline">Permitir</span> Todos
                        </Button>
                    )}
                    {onDenyAll && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onDenyAll}
                            className="h-7 px-2.5 text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-800 dark:hover:bg-rose-950/40 border-rose-500/30"
                        >
                            <Minus className="mr-1 size-3 stroke-[3]" />
                            <span className="hidden sm:inline">Denegar</span> Todos
                        </Button>
                    )}
                    {onResetAll && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onResetAll}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="mr-1 size-3" />
                            Vaciar
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
