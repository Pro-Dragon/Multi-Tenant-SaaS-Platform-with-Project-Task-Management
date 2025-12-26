import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';
import { logAudit } from '../utils/audit';

import { z } from 'zod';

const PLAN_DEFAULTS: Record<string, { maxUsers: number; maxProjects: number }> = {
  free: { maxUsers: 5, maxProjects: 3 },
  pro: { maxUsers: 25, maxProjects: 15 },
  enterprise: { maxUsers: 100, maxProjects: 50 }
};

const registerTenantSchema = z.object({
  tenantName: z.string().min(1),
  subdomain: z.string().min(1).regex(/^[a-z0-9-]+$/i),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminFullName: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSubdomain: z.string().optional(),
  tenantId: z.string().optional()
});

export async function registerTenant(req: Request, res: Response) {
  const parsed = registerTenantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid input', data: parsed.error.flatten() });
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = parsed.data;


  try {
    // Check subdomain unique
    const existing = await prisma.tenant.findUnique({ where: { subdomain } });
    if (existing) return res.status(409).json({ success: false, message: 'Subdomain already exists' });

    const plan = 'free';
    const defaults = PLAN_DEFAULTS[plan];

    // Use a transaction to create tenant & admin atomically
    const result = await prisma.$transaction(async (tx: any) => {
      const tenant = await tx.tenant.create({ data: {
        name: tenantName,
        subdomain,
        status: 'active',
        subscriptionPlan: plan,
        maxUsers: defaults.maxUsers,
        maxProjects: defaults.maxProjects
      }});

      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const admin = await tx.user.create({ data: {
        email: adminEmail,
        passwordHash,
        fullName: adminFullName,
        role: 'tenant_admin',
        tenantId: tenant.id
      }});

      return { tenant, admin };
    });

    // Audit log
    await logAudit({ tenantId: result.tenant.id, userId: result.admin.id, action: 'CREATE_TENANT', entityType: 'tenant', entityId: result.tenant.id, ipAddress: req.ip });

    return res.status(201).json({ success: true, message: 'Tenant registered successfully', data: {
      tenantId: result.tenant.id,
      subdomain: result.tenant.subdomain,
      adminUser: {
        id: result.admin.id,
        email: result.admin.email,
        fullName: result.admin.fullName,
        role: result.admin.role
      }
    }});
  } catch (err: unknown) {
    console.error('registerTenant error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: 'Invalid input', data: parsed.error.flatten() });
  const { email, password, tenantSubdomain, tenantId } = parsed.data;

  try {
    let tenant = null;

    if (tenantSubdomain) {
      tenant = await prisma.tenant.findUnique({ where: { subdomain: tenantSubdomain } });
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
      if (tenant.status !== 'active') return res.status(403).json({ success: false, message: 'Tenant is not active' });
    } else if (tenantId) {
      tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
      if (tenant.status !== 'active') return res.status(403).json({ success: false, message: 'Tenant is not active' });
    }

    const tenantIdToUse = tenant ? tenant.id : null;

    const user = await prisma.user.findFirst({ where: { email, tenantId: tenantIdToUse } });
    if (!user) {
      // Check super admin fallback only when tenant not provided AND email appears to be reserved for super admin
      if (!tenant) {
        const superUser = await prisma.user.findFirst({ where: { email, role: 'super_admin' } });
        if (superUser && await bcrypt.compare(password, superUser.passwordHash)) {
          const token = signToken({ userId: superUser.id, tenantId: null, role: superUser.role });
          await logAudit({ tenantId: null, userId: superUser.id, action: 'LOGIN', entityType: 'user', entityId: superUser.id, ipAddress: req.ip });
          return res.json({ success: true, data: { user: { id: superUser.id, email: superUser.email, fullName: superUser.fullName, role: superUser.role, tenantId: null }, token, expiresIn: 86400 } });
        }
        
        // If no super admin found, check if email exists in any tenant
        const userInAnyTenant = await prisma.user.findFirst({ where: { email } });
        if (userInAnyTenant) {
          // Email exists in a tenant but no tenant was specified - ask user to specify tenant
          return res.status(401).json({ 
            success: false, 
            message: 'This email is associated with a specific tenant. Please specify the tenant subdomain to login.',
            code: 'TENANT_REQUIRED'
          });
        }
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken({ userId: user.id, tenantId: user.tenantId, role: user.role });

    await logAudit({ tenantId: user.tenantId, userId: user.id, action: 'LOGIN', entityType: 'user', entityId: user.id, ipAddress: req.ip });

    // Include tenant info in login response
    const tenantInfo = tenant ? {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      subscriptionPlan: tenant.subscriptionPlan,
      maxUsers: tenant.maxUsers,
      maxProjects: tenant.maxProjects
    } : null;

    return res.json({ success: true, data: { user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, tenantId: user.tenantId, tenant: tenantInfo }, token, expiresIn: 86400 } });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

import { AuthRequest } from '../middleware/auth';

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, include: { tenant: true } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tenantInfo = user.tenant ? {
      id: user.tenant.id,
      name: user.tenant.name,
      subdomain: user.tenant.subdomain,
      subscriptionPlan: user.tenant.subscriptionPlan,
      maxUsers: user.tenant.maxUsers,
      maxProjects: user.tenant.maxProjects
    } : null;

    return res.json({ success: true, data: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive, tenant: tenantInfo } });
  } catch (err: unknown) {
    console.error('me error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const tenantId = req.user ? req.user.tenantId : null;
    const userId = req.user ? req.user.id : null;
    await logAudit({ tenantId, userId, action: 'LOGOUT', entityType: 'user', entityId: userId, ipAddress: req.ip });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: unknown) {
    console.error('logout error', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
