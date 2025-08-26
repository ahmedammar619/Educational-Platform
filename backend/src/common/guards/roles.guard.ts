// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      console.log('🔐 Roles Guard - No roles required, allowing access');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    console.log('🔐 Roles Guard - Checking roles:', {
      requiredRoles,
      userRoles: user?.role,
      userId: user?.sub,
      email: user?.email
    });

    if (!user) {
      console.log('❌ Roles Guard - No user found in request');
      return false;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (hasRole) {
      console.log('✅ Roles Guard - User has required role, allowing access');
    } else {
      console.log('❌ Roles Guard - User does not have required role');
    }
    
    return hasRole;
  }
}
