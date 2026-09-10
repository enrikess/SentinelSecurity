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
        Schema::create('security_menus', function (Blueprint $table) {
            $table->id();

            // Relación recursiva
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('security_menus')
                ->nullOnDelete();

            // Información del menú
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type', 20)->default('menu');
            $table->string('route')->nullable();
            $table->string('icon')->nullable();

            // Orden dentro del mismo nivel
            $table->unsignedInteger('sort_order')->default(0);

            // Permiso de Spatie asociado
            $table->foreignId('permission_id')
                ->nullable()
                ->constrained('security_permissions')
                ->nullOnDelete();

            // Estado
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Índices
            $table->index('parent_id');
            $table->index('permission_id');
            $table->index(['parent_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('security_menus');
    }
};
