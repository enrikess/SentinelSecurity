<?php

namespace App\Models\Security;

use Spatie\Permission\Models\Permission as SpatiePermission;

class Permission extends SpatiePermission
{
    protected $table = 'security_permissions';
}
