/**
 * Compile-time guard for the Brand HQ deal-detail fixture contract.
 *
 * The repo does not have a runtime test runner yet; `npx tsc --noEmit`
 * verifies this fixture exposes every section the route needs.
 */

import {
  BRAND_DEALS,
  BRAND_DEAL_DETAILS,
  getBrandDealDetail,
  type BrandDealDetail,
} from '../mock-brand-data';

const _detail: BrandDealDetail = getBrandDealDetail(BRAND_DEALS[0].id)!;
const _detailTable: Record<string, BrandDealDetail> = BRAND_DEAL_DETAILS;

const _overview: string = _detail.companyOverview.summary;
const _stage: string = _detail.stage.label;
const _amount: string = _detail.money.total;
const _commitment: string = _detail.commitments[0].title;
const _contact: string = _detail.contacts[0].name;
const _review: string = _detail.aiCompliance.summary;
const _sourceState: string = _detail.evidence.sources[0].state;

void [
  _detailTable,
  _overview,
  _stage,
  _amount,
  _commitment,
  _contact,
  _review,
  _sourceState,
];
