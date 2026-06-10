import {
  ROLE_SPINE_SLOT_ORDER,
  ROLE_SPINES,
  getRoleSpineItem,
  getRouteForRoleSlot,
  type RoleSpineSlot,
} from '../role-spine';

type SpineRole = keyof typeof ROLE_SPINES;

const expectedSlots: RoleSpineSlot[] = ['home', 'work', 'explore', 'account'];
const expectedRoles: SpineRole[] = [
  'player',
  'coach',
  'agent',
  'brand',
  'fan',
  'school',
  'nilManager',
];

for (const role of expectedRoles) {
  const spine = ROLE_SPINES[role];
  const _slotCount: 4 = spine.length;
  const _firstRoute: string = getRouteForRoleSlot(role, 'home');

  if (spine.map((item) => item.slot).join('|') !== expectedSlots.join('|')) {
    throw new Error(`${role} role spine is not ordered as the four-slot bottom spine`);
  }

  void [_slotCount, _firstRoute];
}

if (ROLE_SPINE_SLOT_ORDER.join('|') !== expectedSlots.join('|')) {
  throw new Error('role spine slot order drifted from the canonical four slots');
}

// Labels are universal across every role — role-specific vocabulary lives
// in the floating chrome, never in the bottom tab bar itself.
for (const role of expectedRoles) {
  if (getRoleSpineItem(role, 'home').label !== 'Home') {
    throw new Error(`${role} home slot must use the universal "Home" label`);
  }
  if (getRoleSpineItem(role, 'work').label !== 'Work') {
    throw new Error(`${role} work slot must use the universal "Work" label`);
  }
  if (getRoleSpineItem(role, 'explore').label !== 'Triad') {
    throw new Error(`${role} explore slot must use the universal "Triad" label`);
  }
  if (getRoleSpineItem(role, 'account').label !== 'Account') {
    throw new Error(`${role} account slot must use the universal "Account" label`);
  }
}

if (getRouteForRoleSlot('brand', 'work') !== '/(tabs)/activity') {
  throw new Error('work slot should preserve the existing Activity tab route');
}
