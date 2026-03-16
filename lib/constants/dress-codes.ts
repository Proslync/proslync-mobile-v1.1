import type { SelectOption } from '@/components/forms';

export const DRESS_CODE_OPTIONS: SelectOption[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'smart_casual', label: 'Smart Casual' },
  { value: 'business_casual', label: 'Business Casual' },
  { value: 'semi_formal', label: 'Semi-Formal' },
  { value: 'formal', label: 'Formal' },
  { value: 'black_tie', label: 'Black Tie' },
  { value: 'white_party', label: 'White Party' },
  { value: 'themed', label: 'Themed' },
];

/** Map backend enum value to display label */
export const DRESS_CODE_LABELS: Record<string, string> = {
  casual: 'Casual',
  smart_casual: 'Smart Casual',
  business_casual: 'Business Casual',
  semi_formal: 'Semi-Formal',
  formal: 'Formal',
  black_tie: 'Black Tie',
  white_party: 'White Party',
  themed: 'Themed',
  none: 'None',
};
