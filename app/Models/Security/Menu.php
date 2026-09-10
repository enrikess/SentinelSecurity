<?php

namespace App\Models\Security;

use App\Enums\Security\MenuType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    protected $table = 'security_menus';

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'type',
        'route',
        'icon',
        'sort_order',
        'permission_id',
        'is_active',
    ];

    protected $casts = [
        'type' => MenuType::class,
        'is_active' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')
            ->orderBy('sort_order');
    }

    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class);
    }
}
