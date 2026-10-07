import { Shield } from 'lucide-react';
import { SVGAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: SVGAttributes<SVGElement>) {
    return <Shield className={className} {...(props as any)} />;
}
