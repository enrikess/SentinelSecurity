import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export type SecurityMenuType =
    | 'section'
    | 'group'
    | 'menu';

export interface SecurityMenu {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    type: SecurityMenuType;
    route: string | null;
    icon: string | null;
    sort_order: number;
    permission_id: number | null;
    is_active: boolean;
    children: SecurityMenu[];
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    security: SecurityData;
    [key: string]: unknown;
}

export interface SecurityData {
    menus: SecurityMenu[];
    permissions: string[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
