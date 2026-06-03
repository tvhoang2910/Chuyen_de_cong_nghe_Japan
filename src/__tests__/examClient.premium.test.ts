import { describe, expect, it } from 'vitest';
import { isAttemptResultAccessibleStatus, isPremiumUpgradeRequiredError } from '../api/examClient';

describe('isPremiumUpgradeRequiredError', () => {
  it('returns true for 403 premium upgrade message', () => {
    expect(
      isPremiumUpgradeRequiredError(
        403,
        'Premium exam requires an active Premium subscription. Please upgrade to continue.',
      ),
    ).toBe(true);
  });

  it('returns false for non-403 errors', () => {
    expect(isPremiumUpgradeRequiredError(400, 'Premium exam requires upgrade')).toBe(false);
  });

  it('returns false when message does not indicate premium upgrade', () => {
    expect(isPremiumUpgradeRequiredError(403, 'Forbidden')).toBe(false);
  });
});

describe('isAttemptResultAccessibleStatus', () => {
  it('returns true for submitted-like statuses', () => {
    expect(isAttemptResultAccessibleStatus('SUBMITTED')).toBe(true);
    expect(isAttemptResultAccessibleStatus('AUTO_SUBMITTED')).toBe(true);
    expect(isAttemptResultAccessibleStatus('PARTIALLY_GRADED')).toBe(true);
    expect(isAttemptResultAccessibleStatus('GRADED')).toBe(true);
  });

  it('returns false for in-progress status', () => {
    expect(isAttemptResultAccessibleStatus('IN_PROGRESS')).toBe(false);
  });
});
