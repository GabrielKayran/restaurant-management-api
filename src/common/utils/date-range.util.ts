export type DateRange = {
  readonly startDate: Date;
  readonly endDate: Date;
};

export const resolveDateRange = (
  startDate?: string,
  endDate?: string,
): DateRange => {
  if (startDate && endDate) {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };
  }

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  return {
    startDate: startDate ? new Date(startDate) : dayStart,
    endDate: endDate ? new Date(endDate) : dayEnd,
  };
};
