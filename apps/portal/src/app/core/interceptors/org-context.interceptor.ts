import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OrgContextService } from '../services/org-context.service';

const SKIP_PATTERNS = ['/auth/', '/v1/organizations'];

export const orgContextInterceptor: HttpInterceptorFn = (req, next) => {
  const orgContext = inject(OrgContextService);
  const orgId = orgContext.effectiveOrgId();

  if (!orgId) {
    return next(req);
  }

  if (SKIP_PATTERNS.some((pattern) => req.url.includes(pattern))) {
    return next(req);
  }

  if (req.method === 'GET') {
    const cloned = req.clone({
      params: req.params.set('organization_id', String(orgId)),
    });

    return next(cloned);
  }

  if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.body && typeof req.body === 'object') {
    const cloned = req.clone({
      body: { ...req.body, organization_id: orgId },
    });

    return next(cloned);
  }

  return next(req);
};
