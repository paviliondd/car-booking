import { BookingStatus } from '@prisma/client';
import { canTransitionBooking } from './booking-status';

describe('canTransitionBooking', () => {
  it.each([
    [BookingStatus.PENDING, BookingStatus.CONFIRMED],
    [BookingStatus.PENDING, BookingStatus.CANCELLED],
    [BookingStatus.CONFIRMED, BookingStatus.RENTING],
    [BookingStatus.RENTING, BookingStatus.COMPLETED],
  ])('allows %s -> %s', (from, to) => {
    expect(canTransitionBooking(from, to)).toBe(true);
  });

  it.each([
    [BookingStatus.PENDING, BookingStatus.COMPLETED],
    [BookingStatus.COMPLETED, BookingStatus.RENTING],
    [BookingStatus.CANCELLED, BookingStatus.CONFIRMED],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransitionBooking(from, to)).toBe(false);
  });

  it('allows an idempotent update', () => {
    expect(
      canTransitionBooking(BookingStatus.CONFIRMED, BookingStatus.CONFIRMED),
    ).toBe(true);
  });
});
