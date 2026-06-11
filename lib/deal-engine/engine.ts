// lib/deal-engine/engine.ts
// Typed wrappers around the .mjs pure functions.
// Follows the lib/athlete/truth.ts pattern — implementation lives in .mjs
// (node-testable without TS toolchain); this file exposes typed references
// for React Native components.

import {
  generateDealId as _generateDealId,
  defaultRand as _defaultRand,
  computeFees as _computeFees,
  milestoneAutoApproveAt as _milestoneAutoApproveAt,
  isAutoApproved as _isAutoApproved,
  escrowCoverage as _escrowCoverage,
  athleteResponseDeadline as _athleteResponseDeadline,
  isResponseOverdue as _isResponseOverdue,
  deriveDealNotifications as _deriveDealNotifications,
} from './engine.mjs';

import type { FeeResult, EscrowCoverageResult, DealNotification } from './engine.d';

export type { FeeResult, EscrowCoverageResult, DealNotification };

export const generateDealId = _generateDealId as (
  year: number,
  rand: () => string,
) => string;

export const defaultRand = _defaultRand as () => string;

export const computeFees = _computeFees as (
  amountCents: number,
  feeRate?: number,
) => FeeResult;

export const milestoneAutoApproveAt = _milestoneAutoApproveAt as (
  submittedISO: string,
) => string;

export const isAutoApproved = _isAutoApproved as (
  submittedISO: string,
  nowISO: string,
) => boolean;

export const escrowCoverage = _escrowCoverage as (
  milestones: Array<{ amountCents: number }>,
  fundedCents: number,
) => EscrowCoverageResult;

export const athleteResponseDeadline = _athleteResponseDeadline as (
  openedISO: string,
) => string;

export const isResponseOverdue = _isResponseOverdue as (
  deadlineISO: string,
  nowISO: string,
) => boolean;

export const deriveDealNotifications = _deriveDealNotifications as (
  deals: Parameters<typeof _deriveDealNotifications>[0],
  nowISO: string,
) => DealNotification[];
