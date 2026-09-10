<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tableNames = config('permission.table_names');
        $tableName = $tableNames['model_has_permissions'] ?? 'security_model_has_permissions';

        if (Schema::hasTable($tableName) && ! Schema::hasColumn($tableName, 'is_denied')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->boolean('is_denied')->default(false)->after('model_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableNames = config('permission.table_names');
        $tableName = $tableNames['model_has_permissions'] ?? 'security_model_has_permissions';

        if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'is_denied')) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('is_denied');
            });
        }
    }
};
