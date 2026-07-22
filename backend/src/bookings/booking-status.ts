import { BookingStatus } from '@prisma/client';

export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  readonly BookingStatus[]
> = {
  PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  CONFIRMED: [BookingStatus.RENTING, BookingStatus.CANCELLED],
  RENTING: [BookingStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionBooking(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return from === to || BOOKING_STATUS_TRANSITIONS[from].includes(to);
}
