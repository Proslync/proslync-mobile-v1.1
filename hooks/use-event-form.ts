// Multi-step event form hook using react-hook-form with Zod validation
// Uses FormProvider pattern for proper field persistence across steps

import { EventFormData, eventFormSchema } from '@/lib/schemas/events';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';

export type EventFormStep = 'basic' | 'datetime' | 'location' | 'details';

const STEPS: EventFormStep[] = ['basic', 'datetime', 'location', 'details'];

// Map step to its field names for validation
const STEP_FIELDS: Record<EventFormStep, (keyof EventFormData)[]> = {
  basic: ['name', 'description', 'flyerUri', 'flyerMediaType'],
  datetime: ['startDate', 'endDate'],
  location: ['venueId', 'location', 'locationDetails'],
  details: ['maxCapacity', 'minimumAge', 'isPublic'],
};

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
};

interface UseEventFormOptions {
  defaultValues?: Partial<EventFormData>;
}

/**
 * Custom hook for multi-step event form with per-step validation
 * Returns form instance to be used with FormProvider
 */
export function useEventForm(options: UseEventFormOptions = {}) {
  const [currentStep, setCurrentStep] = useState<EventFormStep>('basic');

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...DEFAULT_EVENT_FORM_VALUES,
      ...options.defaultValues,
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
    shouldUnregister: false, // Keep field values when Controllers unmount between steps
    shouldFocusError: true,
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Validate only fields for current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const fields = STEP_FIELDS[currentStep];
    const result = await form.trigger(fields);
    return result;
  }, [currentStep, form]);

  // Watch relevant fields to update canGoNext reactively
  const name = form.watch('name');
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');
  const location = form.watch('location');

  const canGoNext = (() => {
    switch (currentStep) {
      case 'basic':
        return (name?.trim().length ?? 0) > 0;
      case 'datetime':
        return startDate && endDate && startDate < endDate;
      case 'location':
        return (location?.trim().length ?? 0) > 0;
      case 'details':
        return true;
      default:
        return false;
    }
  })();

  const goNext = useCallback(async (): Promise<boolean> => {
    const isValid = await validateCurrentStep();
    if (!isValid) return false;

    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
    return true;
  }, [currentStepIndex, isLastStep, validateCurrentStep]);

  const goBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  }, [currentStepIndex, isFirstStep]);

  const goToStep = useCallback((step: EventFormStep) => {
    setCurrentStep(step);
  }, []);

  return {
    form,
    currentStep,
    currentStepIndex,
    totalSteps: STEPS.length,
    isFirstStep,
    isLastStep,
    goNext,
    goBack,
    goToStep,
    canGoNext,
    validateCurrentStep,
  };
}

// Type for the return value of useEventForm
export type UseEventFormReturn = ReturnType<typeof useEventForm>;

/**
 * Hook for edit event form - same as useEventForm but with reset capability
 */
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
      });
    },
    [eventForm.form]
  );

  return {
    ...eventForm,
    resetWithEvent,
  };
}
