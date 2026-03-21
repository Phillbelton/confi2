/**
 * Mock Email Service for Tests
 *
 * This mock prevents actual emails from being sent during tests
 * and provides a way to verify email functionality without external dependencies.
 */

// Mock methods that match the real EmailService class
const sendPasswordResetEmail = jest.fn().mockResolvedValue(true);
const sendOrderConfirmationEmail = jest.fn().mockResolvedValue(true);
const sendOrderStatusUpdateEmail = jest.fn().mockResolvedValue(true);
const verifyConnection = jest.fn().mockResolvedValue(true);

// Export singleton instance that matches the real emailService structure
export const emailService = {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  verifyConnection,
};

// Helper to reset all email mocks (for use in test setup)
export const resetEmailMocks = () => {
  sendPasswordResetEmail.mockClear();
  sendOrderConfirmationEmail.mockClear();
  sendOrderStatusUpdateEmail.mockClear();
  verifyConnection.mockClear();
};

// Helper to verify an email was sent
export const verifyEmailSent = (emailFn: jest.Mock, recipient: string) => {
  expect(emailFn).toHaveBeenCalled();
  const calls = emailFn.mock.calls;
  const wasCalledWithRecipient = calls.some(
    (call) => call[0] === recipient || call[0]?.email === recipient
  );
  expect(wasCalledWithRecipient).toBe(true);
};
