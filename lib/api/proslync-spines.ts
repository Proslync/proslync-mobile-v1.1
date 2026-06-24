// ── PROSLYNC ROUND-3 SPINE CLIENTS ────────────────────────
// Typed wrappers for the proslync-backend round-3 surfaces wired in
// `src/app.ts` (notifications, wallet, payments, analytics, engagement,
// admin). The legacy `lib/api/{notifications,wallet,...}.ts` modules
// still target the old status-social-api Cloud Run host and have a
// different shape; these wrappers are the canonical pro-backend surface.
//
// Migrate screens incrementally: new code imports `proslync{Surface}Api`
// from `lib/api`, legacy screens keep their existing imports until
// touched.
import { apiClient } from './client';

// ── Common envelopes ──────────────────────────────────────
export interface ProslyncPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore?: boolean;
}

export interface ProslyncDataEnvelope<T> {
  data: T;
}

// ── Notifications ─────────────────────────────────────────
export type ProslyncNotificationCategory =
  | 'deals'
  | 'compliance'
  | 'messages'
  | 'payments'
  | 'system';

export interface ProslyncNotification {
  id: string;
  userId: number;
  category: ProslyncNotificationCategory | string;
  title: string;
  body: string;
  dataJson: string | null;
  groupKey: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
}

export interface ProslyncDeviceToken {
  id: string;
  userId: number;
  platform: 'ios' | 'android' | 'web';
  token: string;
  appInstallId: string | null;
  deviceModel: string | null;
  osVersion: string | null;
  appVersion: string | null;
  locale: string | null;
  lastSeenAt: string;
  disabledAt: string | null;
  disabledReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProslyncNotificationPreferences {
  id: string;
  userId: number;
  dealsEnabled: boolean;
  complianceEnabled: boolean;
  messagesEnabled: boolean;
  paymentsEnabled: boolean;
  systemEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string | null;
  updatedAt: string;
}

export interface ProslyncRegisterDeviceInput {
  platform: 'ios' | 'android' | 'web';
  token: string;
  appInstallId?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  locale?: string;
}

export interface ProslyncNotificationPreferencesPatch {
  dealsEnabled?: boolean;
  complianceEnabled?: boolean;
  messagesEnabled?: boolean;
  paymentsEnabled?: boolean;
  systemEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  quietHoursTimezone?: string | null;
}

export const proslyncNotificationsApi = {
  // Devices
  registerDevice: (input: ProslyncRegisterDeviceInput) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncDeviceToken>>(
      '/api/notifications/devices',
      input,
    ),
  listDevices: () =>
    apiClient.get<ProslyncDataEnvelope<ProslyncDeviceToken[]>>(
      '/api/notifications/devices',
    ),
  deleteDevice: (id: string) =>
    apiClient.delete<ProslyncDataEnvelope<ProslyncDeviceToken>>(
      `/api/notifications/devices/${encodeURIComponent(id)}`,
    ),

  // Inbox
  listInbox: (params?: { unreadOnly?: boolean; limit?: number; cursor?: string }) => {
    const qs = new URLSearchParams();
    if (params?.unreadOnly) qs.set('unreadOnly', 'true');
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<ProslyncPage<ProslyncNotification>>(
      `/api/notifications/${suffix}`,
    );
  },
  markRead: (id: string) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncNotification>>(
      `/api/notifications/${encodeURIComponent(id)}/read`,
    ),
  markAllRead: () =>
    apiClient.post<ProslyncDataEnvelope<{ updated: number }>>(
      '/api/notifications/read-all',
    ),
  dismiss: (id: string) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncNotification>>(
      `/api/notifications/${encodeURIComponent(id)}/dismiss`,
    ),

  // Preferences
  getPreferences: () =>
    apiClient.get<ProslyncDataEnvelope<ProslyncNotificationPreferences>>(
      '/api/notifications/preferences',
    ),
  updatePreferences: (patch: ProslyncNotificationPreferencesPatch) =>
    apiClient.patch<ProslyncDataEnvelope<ProslyncNotificationPreferences>>(
      '/api/notifications/preferences',
      patch,
    ),

  // QA / introspection
  sendTest: (body?: { title?: string; body?: string }) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncNotification>>(
      '/api/notifications/test',
      body ?? {},
    ),
  describeAdapters: () =>
    apiClient.get<ProslyncDataEnvelope<unknown>>('/api/notifications/adapters'),
};

// ── Wallet ────────────────────────────────────────────────
export type ProslyncWalletHolderType =
  | 'athlete'
  | 'brand'
  | 'school'
  | 'platform';

export interface ProslyncWallet {
  id: string;
  holderType: ProslyncWalletHolderType;
  holderId: string;
  userId: number | null;
  currency: string;
  balanceCents: number;
  pendingCents: number;
  status: 'active' | 'frozen' | 'closed' | string;
  createdAt: string;
  updatedAt: string;
}

export type ProslyncWalletTxnKind =
  | 'credit'
  | 'debit'
  | 'hold'
  | 'release'
  | 'refund'
  | 'fee';

export type ProslyncWalletTxnSourceType =
  | 'payment'
  | 'payout'
  | 'rev-share'
  | 'manual'
  | 'refund'
  | 'fee';

export interface ProslyncWalletTransaction {
  id: string;
  walletId: string;
  kind: ProslyncWalletTxnKind;
  amountCents: number;
  currency: string;
  status: 'pending' | 'posted' | 'voided';
  sourceType: ProslyncWalletTxnSourceType;
  sourceId: string | null;
  memo: string | null;
  idempotencyKey: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface ProslyncRecordTransactionInput {
  walletId: string;
  kind: ProslyncWalletTxnKind;
  amountCents: number;
  sourceType: ProslyncWalletTxnSourceType;
  sourceId?: string;
  memo?: string;
  idempotencyKey?: string;
  status?: 'pending' | 'posted' | 'voided';
}

export const proslyncWalletApi = {
  getMyWallet: () =>
    apiClient.get<ProslyncDataEnvelope<ProslyncWallet>>('/api/wallet/me'),
  listTransactions: (
    walletId: string,
    params?: {
      kind?: ProslyncWalletTxnKind;
      sourceType?: ProslyncWalletTxnSourceType;
      limit?: number;
      cursor?: string;
    },
  ) => {
    const qs = new URLSearchParams();
    if (params?.kind) qs.set('kind', params.kind);
    if (params?.sourceType) qs.set('sourceType', params.sourceType);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<ProslyncPage<ProslyncWalletTransaction>>(
      `/api/wallet/${encodeURIComponent(walletId)}/transactions${suffix}`,
    );
  },
  reconcile: (walletId: string) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncWallet>>(
      `/api/wallet/${encodeURIComponent(walletId)}/reconcile`,
    ),
  recordTransaction: (input: ProslyncRecordTransactionInput) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncWalletTransaction>>(
      '/api/wallet/transactions',
      input,
    ),
};

// ── NIL Deals (athlete-owned contracts) ───────────────────
// Backed by `proslync-backend/src/routes/nil-deals.ts`. The athlete's
// "active contracts" are NIL deal rows filtered by athleteId; stage is
// the 9-state lifecycle from negotiating → settled.
export type ProslyncNilDealStage =
  | 'open'
  | 'applied'
  | 'reviewing'
  | 'negotiating'
  | 'committed'
  | 'live'
  | 'delivered'
  | 'settled'
  | 'disputed';

export type ProslyncNilDealContractStatus = 'pending' | 'signed' | 'expired';

export type ProslyncNilDealReviewSummary =
  | 'all-pending'
  | 'any-flagged'
  | 'any-rejected'
  | 'all-cleared'
  | 'mixed';

export interface ProslyncNilDeal {
  id: string;
  sourceOpenDealId: string | null;
  sourceApplicationId: string | null;
  athleteId: string;
  brandId: string;
  /** Brand display name when the backend denormalizes it onto the row.
   *  Preferred over the derived "Brand <id>" fallback when present. */
  brandName?: string | null;
  categoryId: string | null;
  title: string;
  stage: ProslyncNilDealStage;
  amountCents: number;
  startDate: string | null;
  endDate: string | null;
  exclusivity: string | null;
  contractStatus: ProslyncNilDealContractStatus;
  reviewSummary: ProslyncNilDealReviewSummary;
  appealState: 'none' | 'requested' | 'in_progress' | 'decided';
  createdAt: string;
  updatedAt: string;
}

export const proslyncNilDealsApi = {
  list: (params?: {
    athleteId?: string;
    brandId?: string;
    stage?: ProslyncNilDealStage;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.athleteId) qs.set('athleteId', params.athleteId);
    if (params?.brandId) qs.set('brandId', params.brandId);
    if (params?.stage) qs.set('stage', params.stage);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<ProslyncDataEnvelope<ProslyncNilDeal[]>>(
      `/api/nil-deals${suffix}`,
    );
  },
};

// ── Campaigns (open deals / offer inbox) ──────────────────
// Backed by `proslync-backend/src/routes/campaigns.ts`. Athlete-facing
// inbound offers are surfaced as `status=open` rows here.
export type ProslyncCampaignStatus =
  | 'draft'
  | 'open'
  | 'reviewing'
  | 'closed-filled'
  | 'closed-cancelled';

export interface ProslyncCampaign {
  id: string;
  brandId: string;
  /** Brand display name returned by the public campaigns endpoint.
   *  Preferred over the derived "Brand <id>" fallback when present. */
  brandName?: string | null;
  categoryId: string | null;
  title: string;
  briefMarkdown: string;
  budgetMinCents: number;
  budgetMaxCents: number;
  exclusivityRequired: boolean;
  applicationOpensAt: string;
  applicationClosesAt: string;
  status: ProslyncCampaignStatus;
  selectionPolicy: 'first-fit' | 'shortlist-then-pick' | 'ai-ranked-shortlist';
  desiredAttributesJson: string | null;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export const proslyncCampaignsApi = {
  list: (params?: {
    brandId?: string;
    status?: ProslyncCampaignStatus;
    limit?: number;
    cursor?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.brandId) qs.set('brandId', params.brandId);
    if (params?.status) qs.set('status', params.status);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<ProslyncPage<ProslyncCampaign>>(
      `/api/campaigns${suffix}`,
    );
  },
};

// ── Payments ──────────────────────────────────────────────
export type ProslyncPaymentMethodKind = 'card' | 'us_bank_account' | 'other';
export type ProslyncPaymentIntentStatus =
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface ProslyncPaymentMethod {
  id: string;
  userId: number;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  kind: ProslyncPaymentMethodKind;
  last4: string | null;
  brand: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProslyncPaymentIntent {
  id: string;
  walletId: string;
  amountCents: number;
  currency: string;
  status: ProslyncPaymentIntentStatus;
  stripePaymentIntentId: string;
  clientSecret: string;
  paymentMethodId: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  metadataJson: string | null;
  adapter: string;
  idempotencyKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProslyncAttachPaymentMethodInput {
  stripePaymentMethodId: string;
  kind: ProslyncPaymentMethodKind;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  setDefault?: boolean;
}

export interface ProslyncCreatePaymentIntentInput {
  walletId: string;
  amountCents: number;
  paymentMethodId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
}

export const proslyncPaymentsApi = {
  describeAdapters: () =>
    apiClient.get<ProslyncDataEnvelope<unknown>>('/api/payments/adapters'),

  // Payment methods
  listMethods: () =>
    apiClient.get<ProslyncDataEnvelope<ProslyncPaymentMethod[]>>(
      '/api/payments/methods',
    ),
  attachMethod: (input: ProslyncAttachPaymentMethodInput) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncPaymentMethod>>(
      '/api/payments/methods',
      input,
    ),
  detachMethod: (id: string) =>
    apiClient.delete<ProslyncDataEnvelope<{ ok: true }>>(
      `/api/payments/methods/${encodeURIComponent(id)}`,
    ),

  // Intents
  listIntents: (params: {
    walletId: string;
    status?: ProslyncPaymentIntentStatus;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    qs.set('walletId', params.walletId);
    if (params.status) qs.set('status', params.status);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    return apiClient.get<ProslyncDataEnvelope<ProslyncPaymentIntent[]>>(
      `/api/payments/intents?${qs.toString()}`,
    );
  },
  createIntent: (input: ProslyncCreatePaymentIntentInput) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncPaymentIntent>>(
      '/api/payments/intents',
      input,
    ),
  confirmIntent: (id: string, paymentMethodId?: string) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncPaymentIntent>>(
      `/api/payments/intents/${encodeURIComponent(id)}/confirm`,
      paymentMethodId ? { paymentMethodId } : {},
    ),
  refundIntent: (
    id: string,
    body?: { amountCents?: number; reason?: string },
  ) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncPaymentIntent>>(
      `/api/payments/intents/${encodeURIComponent(id)}/refund`,
      body ?? {},
    ),
};

// ── Analytics ─────────────────────────────────────────────
export type ProslyncAnalyticsEventCategory =
  | 'product'
  | 'compliance'
  | 'engagement'
  | 'performance'
  | 'error';

export interface ProslyncAnalyticsEventInput {
  anonymousId?: string;
  sessionId?: string;
  eventName: string;
  eventCategory?: ProslyncAnalyticsEventCategory;
  propertiesJson?: string;
  surface?: string;
  route?: string;
  referrer?: string;
  deviceJson?: string;
  occurredAt?: string;
}

export interface ProslyncAnalyticsEvent {
  id: string;
  userId: number | null;
  anonymousId: string | null;
  sessionId: string | null;
  eventName: string;
  eventCategory: ProslyncAnalyticsEventCategory | null;
  propertiesJson: string | null;
  surface: string | null;
  route: string | null;
  referrer: string | null;
  occurredAt: string;
  receivedAt: string;
}

export interface ProslyncAnalyticsSession {
  id: string;
  userId: number | null;
  anonymousId: string | null;
  startedAt: string;
  lastSeenAt: string;
  eventCount: number;
  firstRoute: string | null;
  surface: string | null;
  createdAt: string;
}

export const proslyncAnalyticsApi = {
  recordEvent: (event: ProslyncAnalyticsEventInput) =>
    apiClient.post<ProslyncDataEnvelope<{ id: string }>>(
      '/api/analytics/events',
      event,
    ),
  recordEventBatch: (events: ProslyncAnalyticsEventInput[]) =>
    apiClient.post<ProslyncDataEnvelope<{ accepted: number }>>(
      '/api/analytics/events/batch',
      { events },
    ),
  listEvents: (params?: {
    eventName?: string;
    sessionId?: string;
    sinceMs?: number;
    untilMs?: number;
    limit?: number;
    cursor?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.eventName) qs.set('eventName', params.eventName);
    if (params?.sessionId) qs.set('sessionId', params.sessionId);
    if (params?.sinceMs !== undefined) qs.set('sinceMs', String(params.sinceMs));
    if (params?.untilMs !== undefined) qs.set('untilMs', String(params.untilMs));
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<ProslyncPage<ProslyncAnalyticsEvent>>(
      `/api/analytics/events${suffix}`,
    );
  },
  getSession: (id: string) =>
    apiClient.get<ProslyncDataEnvelope<ProslyncAnalyticsSession>>(
      `/api/analytics/sessions/${encodeURIComponent(id)}`,
    ),
  describeAdapters: () =>
    apiClient.get<ProslyncDataEnvelope<unknown>>('/api/analytics/adapters'),
};

// ── Engagement (analytics aggregations) ──────────────────
export type ProslyncEngagementGroupBy = 'hour' | 'day' | 'event';

export interface ProslyncEngagementCount {
  bucket: string;
  count: number;
  eventName?: string;
}

export interface ProslyncFunnelRow {
  step: string;
  count: number;
}

export interface ProslyncRetentionRow {
  cohortWeek: number;
  cohortSize: number;
  returned: number;
}

export const proslyncEngagementApi = {
  counts: (params: {
    groupBy: ProslyncEngagementGroupBy;
    eventName?: string;
    eventCategory?: ProslyncAnalyticsEventCategory;
    sinceMs?: number;
    untilMs?: number;
  }) => {
    const qs = new URLSearchParams();
    qs.set('groupBy', params.groupBy);
    if (params.eventName) qs.set('eventName', params.eventName);
    if (params.eventCategory) qs.set('eventCategory', params.eventCategory);
    if (params.sinceMs !== undefined) qs.set('sinceMs', String(params.sinceMs));
    if (params.untilMs !== undefined) qs.set('untilMs', String(params.untilMs));
    return apiClient.get<ProslyncDataEnvelope<ProslyncEngagementCount[]>>(
      `/api/engagement/counts?${qs.toString()}`,
    );
  },
  funnel: (body: { steps: string[]; sinceMs?: number; untilMs?: number }) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncFunnelRow[]>>(
      '/api/engagement/funnel',
      body,
    ),
  retention: (body: {
    cohortByEvent: string;
    returnEvent: string;
    sinceMs: number;
    weeks: number;
  }) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncRetentionRow[]>>(
      '/api/engagement/retention',
      body,
    ),
};

// ── Admin ─────────────────────────────────────────────────
export type ProslyncAdminUserRole = 'user' | 'owner' | 'admin';
export type ProslyncProductRole =
  | 'player'
  | 'coach'
  | 'agent'
  | 'brand'
  | 'fan'
  | 'school'
  | 'nilManager';

export interface ProslyncAdminUserRow {
  id: number;
  userName: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: ProslyncAdminUserRole;
  status: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  productRoles: { role: ProslyncProductRole; isPrimary: boolean }[];
}

export interface ProslyncAdminAuditEvent {
  id: string;
  actorUserId: number | null;
  actorIpHash: string | null;
  action: string;
  targetType: 'user' | 'role' | 'feature_flag' | 'system' | string;
  targetId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  reason: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ProslyncFeatureFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  audienceJson: string | null;
  updatedBy: number | null;
  updatedAt: string;
  createdAt: string;
}

export interface ProslyncFeatureFlagUpsertInput {
  id: string;
  key?: string;
  description?: string;
  enabled: boolean;
  rolloutPercent?: number;
  audienceJson?: string | null;
  reason?: string;
}

export const proslyncAdminApi = {
  // Users
  listUsers: (params?: {
    search?: string;
    role?: ProslyncAdminUserRole;
    verified?: boolean;
    limit?: number;
    cursor?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.role) qs.set('role', params.role);
    if (params?.verified !== undefined)
      qs.set('verified', params.verified ? 'true' : 'false');
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<ProslyncPage<ProslyncAdminUserRow>>(
      `/api/admin/users${suffix}`,
    );
  },
  getUser: (id: number) =>
    apiClient.get<ProslyncDataEnvelope<ProslyncAdminUserRow>>(
      `/api/admin/users/${id}`,
    ),
  setUserRole: (id: number, role: ProslyncAdminUserRole, reason?: string) =>
    apiClient.patch<ProslyncDataEnvelope<ProslyncAdminUserRow>>(
      `/api/admin/users/${id}/role`,
      { role, reason },
    ),
  assignProductRole: (
    id: number,
    role: ProslyncProductRole,
    opts?: { isPrimary?: boolean; reason?: string },
  ) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncAdminUserRow>>(
      `/api/admin/users/${id}/product-roles`,
      { role, isPrimary: opts?.isPrimary, reason: opts?.reason },
    ),
  revokeProductRole: (id: number, role: ProslyncProductRole, reason?: string) => {
    const qs = reason
      ? `?reason=${encodeURIComponent(reason)}`
      : '';
    return apiClient.delete<ProslyncDataEnvelope<ProslyncAdminUserRow>>(
      `/api/admin/users/${id}/product-roles/${encodeURIComponent(role)}${qs}`,
    );
  },
  disableUser: (id: number, reason?: string) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncAdminUserRow>>(
      `/api/admin/users/${id}/disable`,
      { reason },
    ),
  enableUser: (id: number) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncAdminUserRow>>(
      `/api/admin/users/${id}/enable`,
    ),

  // Audit
  listAudit: (params?: {
    actorUserId?: number;
    targetType?: 'user' | 'role' | 'feature_flag' | 'system';
    targetId?: string;
    action?: string;
    sinceMs?: number;
    limit?: number;
    cursor?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.actorUserId !== undefined)
      qs.set('actorUserId', String(params.actorUserId));
    if (params?.targetType) qs.set('targetType', params.targetType);
    if (params?.targetId) qs.set('targetId', params.targetId);
    if (params?.action) qs.set('action', params.action);
    if (params?.sinceMs !== undefined) qs.set('sinceMs', String(params.sinceMs));
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.cursor) qs.set('cursor', params.cursor);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get<ProslyncPage<ProslyncAdminAuditEvent>>(
      `/api/admin/audit${suffix}`,
    );
  },

  // Feature flags
  listFlags: () =>
    apiClient.get<ProslyncDataEnvelope<ProslyncFeatureFlag[]>>(
      '/api/admin/flags',
    ),
  upsertFlag: (input: ProslyncFeatureFlagUpsertInput) =>
    apiClient.post<ProslyncDataEnvelope<ProslyncFeatureFlag>>(
      '/api/admin/flags',
      input,
    ),
  deleteFlag: (id: string) =>
    apiClient.delete<ProslyncDataEnvelope<ProslyncFeatureFlag>>(
      `/api/admin/flags/${encodeURIComponent(id)}`,
    ),
  evaluateFlag: (
    id: string,
    body: {
      userId: number;
      productRoles?: string[];
      schoolId?: string | null;
    },
  ) =>
    apiClient.post<ProslyncDataEnvelope<{ enabled: boolean }>>(
      `/api/admin/flags/${encodeURIComponent(id)}/evaluate`,
      body,
    ),
};
