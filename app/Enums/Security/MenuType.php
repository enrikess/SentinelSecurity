<?php

namespace App\Enums\Security;

enum MenuType: string
{
    case SECTION = 'section';
    case GROUP = 'group';
    case MENU = 'menu';
}
