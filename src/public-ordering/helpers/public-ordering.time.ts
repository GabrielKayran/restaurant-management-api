import { TimeContext } from './public-ordering.types';

export const getTimeContext = (timeZone: string): TimeContext => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? '0',
  );

  return {
    now,
    dayOfWeek: weekdayToNumber(weekday),
    minutesOfDay: hour * 60 + minute,
  };
};

export const weekdayToNumber = (weekday: string): number => {
  const normalized = weekday.slice(0, 3).toLowerCase();

  if (normalized === 'sun') return 0;
  if (normalized === 'mon') return 1;
  if (normalized === 'tue') return 2;
  if (normalized === 'wed') return 3;
  if (normalized === 'thu') return 4;
  if (normalized === 'fri') return 5;
  return 6;
};
