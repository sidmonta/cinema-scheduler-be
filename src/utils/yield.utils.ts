export const yieldToEventLoop = (): Promise<void> => {
  return new Promise((resolve) => setImmediate(resolve));
};
