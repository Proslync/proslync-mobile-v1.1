// Single-page event form hook using react-hook-form with Zod validation
// Uses FormProvider pattern for proper field persistence

import { EventFormData, eventFormSchema } from '@/lib/schemas/events';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

export type EventFormStep = 'basic' | 'datetime' | 'location' | 'details' | 'pricing';

// Default values for the form - exported for reuse
export const DEFAULT_EVENT_FORM_VALUES: EventFormData = {
  name: '',
  description: '',
  flyerUri: null,
  flyerMediaType: null,
  startDate: new Date(),
  endDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours later
  venueId: undefined,
  location: '',
  locationDetails: undefined,
  maxCapacity: '',
  minimumAge: '21',
  isPublic: true,
  isPaid: false,
  tiers: [],
  doorCoverPrice: '',
};

interface UseEventFormOptions {
  defaultValues?: Partial<EventFormData>;
}

export function useEventForm(options: UseEventFormOptions = {}) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...DEFAULT_EVENT_FORM_VALUES,
      ...options.defaultValues,
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldUnregister: false,
    shouldFocusError: true,
  });

  // Watch fields for canSubmit
  const name = form.watch('name');
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');
  const location = form.watch('location');
  const isPaid = form.watch('isPaid');
  const tiers = form.watch('tiers');

  const canSubmit = useMemo(() => {
    if (!name?.trim()) return false;
    if (!startDate || !endDate || startDate >= endDate) return false;
    if (!location?.trim()) return false;
    if (isPaid && (!Array.isArray(tiers) || tiers.length === 0 || !tiers.every((t) => t.pricing?.length > 0))) {
      return false;
    }
    return true;
  }, [name, startDate, endDate, location, isPaid, tiers]);

  return {
    form,
    canSubmit,
    isPaid,
  };
}

// Type for the return value of useEventForm
export type UseEventFormReturn = ReturnType<typeof useEventForm>;

export function useEditEventForm(options: UseEventFormOptions = {}) {
  const eventForm = useEventForm(options);

  // Reset form with event data
  const resetWithEvent = useCallback(
    (eventData: {
      name?: string;
      description?: string;
      startDate?: string | Date;
      endDate?: string | Date;
      location?: string;
      maxCapacity?: number;
      minimumAge?: number;
      isPublic?: boolean;
      isPaid?: boolean;
      doorCoverPriceCents?: number;
    }) => {
      eventForm.form.reset({
        name: eventData.name || '',
        description: eventData.description || '',
        flyerUri: null, // Only set if user picks new flyer
        flyerMediaType: null,
        startDate: eventData.startDate ? new Date(eventData.startDate) : new Date(),
        endDate: eventData.endDate
          ? new Date(eventData.endDate)
          : new Date(Date.now() + 4 * 60 * 60 * 1000),
        location: eventData.location || '',
        maxCapacity: eventData.maxCapacity?.toString() || '',
        minimumAge: eventData.minimumAge?.toString() || '21',
        isPublic: eventData.isPublic ?? true,
        isPaid: eventData.isPaid ?? false,
        tiers: [],
        doorCoverPrice: eventData.doorCoverPriceCents
          ? (eventData.doorCoverPriceCents / 100).toFixed(2)
          : '',
      });
    },
    [eventForm.form]
  );

  return {
    ...eventForm,
    resetWithEvent,
  };
}
