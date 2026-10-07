import { Shield } from 'lucide-react';

export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                <Shield className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Sentinel</span>
                <span className="text-muted-foreground truncate text-xs">Security System</span>
            </div>
        </>
    );
}
