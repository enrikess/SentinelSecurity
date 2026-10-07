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

export type SecurityMenuType = 'section' | 'group' | 'menu';

export interface SecuritySessionUser {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
}

export interface SecuritySession {
    id: string;
    user_id?: number | null;
    user?: SecuritySessionUser | null;
    ip_address: string | null;
    browser: string;
    platform: string;
    device: string;
    user_agent: string | null;
    is_current: boolean;
    last_activity: string;
}

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
    permission?: { id: number; name: string } | null;
    is_active: boolean;
    children: SecurityMenu[];
}

export interface FailedLoginAttemptUser {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
}

export interface FailedLoginAttemptItem {
    id: number;
    email: string;
    ip_address: string;
    reason: string;
    created_at: string;
    created_at_human: string;
    user?: FailedLoginAttemptUser | null;
    agent: {
        browser: string;
        platform: string;
        device: string;
    };
    is_locked: boolean;
    lockout_remaining: number;
}

export interface FailedLoginMetrics {
    total_24h: number;
    unique_emails_24h: number;
    unique_ips_24h: number;
    top_ip?: {
        ip: string;
        count: number;
    } | null;
    top_email?: {
        email: string;
        count: number;
    } | null;
}

export interface FailedLoginLockIp {
    ip: string;
    attempts: number;
    max_attempts: number;
    is_locked: boolean;
    available_in: number;
    human_remaining: string | null;
    last_attempt_at: string | null;
}

export interface FailedLoginLockStatus {
    email: string;
    total_attempts: number;
    locked_count: number;
    ips: FailedLoginLockIp[];
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
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
