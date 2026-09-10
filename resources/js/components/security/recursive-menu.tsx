import {
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type SecurityMenu } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { securityIcons } from './icon-map';

interface RecursiveMenuProps {
    menus: SecurityMenu[];
    level?: number;
}

export function RecursiveMenu({
    menus,
    level = 0,
}: RecursiveMenuProps) {
    const page = usePage();

    return (
        <SidebarMenu>
            {menus.map((menu) => (
                <RecursiveMenuItem
                    key={menu.id}
                    menu={menu}
                    currentUrl={page.url}
                    level={level}
                />
            ))}
        </SidebarMenu>
    );
}

interface RecursiveMenuItemProps {
    menu: SecurityMenu;
    currentUrl: string;
    level: number;
}

function RecursiveMenuItem({
    menu,
    currentUrl,
    level,
}: RecursiveMenuItemProps) {
    const hasChildren = menu.children.length > 0;

    const isCurrentRoute =
        menu.type === 'menu' &&
        !!menu.route &&
        isRouteActive(currentUrl, menu.route);

    const hasActiveChild = hasActiveDescendant(
        menu.children,
        currentUrl,
    );

    const shouldBeOpen = hasActiveChild;

    const [open, setOpen] = useState(shouldBeOpen);

    useEffect(() => {
        if (shouldBeOpen) {
            setOpen(true);
        }
    }, [shouldBeOpen]);

    const Icon = getMenuIcon(menu.icon);

    /*
    |--------------------------------------------------------------------------
    | SECTION
    |--------------------------------------------------------------------------
    */

    if (menu.type === 'section') {
        return (
            <>
                <SidebarGroupLabel className="mt-4">
                    {menu.name}
                </SidebarGroupLabel>

                {hasChildren && (
                    <RecursiveMenu
                        menus={menu.children}
                        level={level + 1}
                    />
                )}
            </>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | GROUP
    |--------------------------------------------------------------------------
    */

    if (menu.type === 'group') {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    isActive={hasActiveChild}
                    tooltip={menu.name}
                >
                    {Icon && <Icon />}

                    <span>{menu.name}</span>

                    {hasChildren && (
                        <ChevronRight
                            className={`ml-auto size-4 transition-transform ${
                                open ? 'rotate-90' : ''
                            }`}
                        />
                    )}
                </SidebarMenuButton>

                {open && hasChildren && (
                    <div className="ml-4">
                        <RecursiveMenu
                            menus={menu.children}
                            level={level + 1}
                        />
                    </div>
                )}
            </SidebarMenuItem>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MENU
    |--------------------------------------------------------------------------
    */

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={isCurrentRoute}
                tooltip={menu.name}
            >
                <Link
                    href={menu.route ?? '#'}
                    prefetch
                >
                    {Icon && <Icon />}

                    <span>{menu.name}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

/*
|--------------------------------------------------------------------------
| ICON
|--------------------------------------------------------------------------
*/

function getMenuIcon(icon: string | null) {
    if (!icon) {
        return null;
    }

    return (
        securityIcons[
            icon as keyof typeof securityIcons
        ] ?? null
    );
}

/*
|--------------------------------------------------------------------------
| ACTIVE ROUTE
|--------------------------------------------------------------------------
*/

function isRouteActive(
    currentUrl: string,
    route: string,
): boolean {
    if (route === '/') {
        return currentUrl === '/';
    }

    return (
        currentUrl === route ||
        currentUrl.startsWith(`${route}/`)
    );
}

/*
|--------------------------------------------------------------------------
| ACTIVE DESCENDANT
|--------------------------------------------------------------------------
*/

function hasActiveDescendant(
    menus: SecurityMenu[],
    currentUrl: string,
): boolean {
    return menus.some((menu) => {
        if (
            menu.type === 'menu' &&
            menu.route &&
            isRouteActive(currentUrl, menu.route)
        ) {
            return true;
        }

        return hasActiveDescendant(
            menu.children,
            currentUrl,
        );
    });
}
