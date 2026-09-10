import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

export type PermissionStatus = "allow" | "deny" | "none";

interface TriStateCheckboxProps {
    status: PermissionStatus;
    onChange: (nextStatus: PermissionStatus) => void;
    className?: string;
    size?: "sm" | "md";
}

/**
 * Checkbox tri-estado (+, -, vacío).
 * Al hacer clic, cicla: none (vacío) -> allow (+) -> deny (-) -> none (vacío)
 */
export function TriStateCheckbox({ status, onChange, className, size = "md" }: TriStateCheckboxProps) {
    const cycleNext = () => {
        if (status === "none") {
            onChange("allow");
        } else if (status === "allow") {
            onChange("deny");
        } else {
            onChange("none");
        }
    };

    const boxSize = size === "sm" ? "size-4" : "size-5";
    const iconSize = size === "sm" ? "size-3" : "size-3.5";

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={status === "allow" ? true : status === "deny" ? "mixed" : false}
            aria-label={`Permiso: ${status === "allow" ? "Permitir (+)" : status === "deny" ? "Denegar (-)" : "Vacío"}`}
            onClick={(e) => {
                e.stopPropagation();
                cycleNext();
            }}
            className={cn(
                boxSize,
                "flex items-center justify-center rounded-md border text-xs font-bold transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none cursor-pointer shrink-0",
                status === "none" && "border-input bg-background hover:bg-muted hover:border-primary/50 text-transparent",
                status === "allow" && "border-emerald-600 bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 hover:border-emerald-700",
                status === "deny" && "border-destructive bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
                className,
            )}
        >
            {status === "allow" && <Plus className={cn(iconSize, "stroke-[3]")} />}
            {status === "deny" && <Minus className={cn(iconSize, "stroke-[3]")} />}
        </button>
    );
}

/**
 * Leyenda explicativa de los 3 estados (+, -, vacío).
 */
export function TriStateLegend() {
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-3.5 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Estados:</span>

            <div className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded border border-input bg-background text-[10px] text-muted-foreground">
                    ∅
                </span>
                <span>
                    <strong className="text-foreground font-medium">Vacío:</strong> Hereda de roles
                </span>
            </div>

            <div className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded border border-emerald-600 bg-emerald-600 text-white text-[10px] font-bold">
                    +
                </span>
                <span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-medium">(+) Permitir:</strong> Permiso directo
                </span>
            </div>

            <div className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded border border-destructive bg-destructive text-destructive-foreground text-[10px] font-bold">
                    -
                </span>
                <span>
                    <strong className="text-destructive font-medium">(-) Denegar:</strong> Bloqueo directo (anula roles)
                </span>
            </div>
        </div>
    );
}
