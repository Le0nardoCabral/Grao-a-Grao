const TIME_ZONE = "America/Sao_Paulo";

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getDateTimeParts(date: Date): DateTimeParts {
  const parts = new Map(
    dateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.get("year")!,
    month: parts.get("month")!,
    day: parts.get("day")!,
    hour: parts.get("hour")!,
    minute: parts.get("minute")!,
    second: parts.get("second")!,
  };
}

function getTimeZoneOffsetMilliseconds(date: Date): number {
  const parts = getDateTimeParts(date);
  const sameWallClockInUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    date.getUTCMilliseconds(),
  );

  return sameWallClockInUtc - date.getTime();
}

export function adicionarDiasEmBrasilia(date: Date, days: number): Date {
  const parts = getDateTimeParts(date);
  const targetWallClock = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day + days,
    parts.hour,
    parts.minute,
    parts.second,
    date.getUTCMilliseconds(),
  );

  let result = new Date(targetWallClock);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    result = new Date(targetWallClock - getTimeZoneOffsetMilliseconds(result));
  }

  return result;
}

export function mesEmBrasilia(date: Date): number {
  return getDateTimeParts(date).month;
}
