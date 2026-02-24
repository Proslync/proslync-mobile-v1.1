// Terminal API - Stripe Tap to Pay
import { apiClient } from "./client";
import type {
  TerminalConnectionTokenResponse,
  TerminalLocationResponse,
  CreateTerminalPaymentIntentRequest,
  CreateTerminalPaymentIntentResponse,
} from "../types/terminal.types";

export const terminalApi = {
  /**
   * Create a connection token for the Stripe Terminal SDK
   * Backend endpoint: POST /api/terminal/connection-token
   */
  createConnectionToken: async (): Promise<TerminalConnectionTokenResponse> => {
    return apiClient.post<TerminalConnectionTokenResponse>(
      "/api/terminal/connection-token",
    );
  },

  /**
   * Get or create a Terminal location for an event
   * Backend endpoint: GET /api/events/:eventId/terminal/location
   */
  getLocation: async (eventId: number): Promise<TerminalLocationResponse> => {
    return apiClient.get<TerminalLocationResponse>(
      `/api/events/${eventId}/terminal/location`,
    );
  },

  /**
   * Create a payment intent for Tap to Pay (card_present)
   * Backend endpoint: POST /api/events/:eventId/terminal/payment-intent
   */
  createPaymentIntent: async (
    eventId: number,
    data: CreateTerminalPaymentIntentRequest,
  ): Promise<CreateTerminalPaymentIntentResponse> => {
    return apiClient.post<CreateTerminalPaymentIntentResponse>(
      `/api/events/${eventId}/terminal/payment-intent`,
      data,
    );
  },
};
