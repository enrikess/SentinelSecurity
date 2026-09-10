<?php

namespace App\Models\Security;

use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $table = 'security_roles';
}
