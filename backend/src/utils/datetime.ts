const BOGOTA_TIMEZONE = "America/Bogota";

const getBogotaDateTimeParts = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BOGOTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
};

const extractYmd = (value: string | Date) => {
  if (value instanceof Date) {
    const parts = getBogotaDateTimeParts(value);
    return { year: parts.year, month: parts.month, day: parts.day };
  }

  const raw = String(value || "").trim();
  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return { year: ymdMatch[1], month: ymdMatch[2], day: ymdMatch[3] };
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const parts = getBogotaDateTimeParts(parsed);
    return { year: parts.year, month: parts.month, day: parts.day };
  }

  throw new Error(`Invalid date value: ${raw}`);
};

export const getBogotaTimestamp = (date = new Date()) => {
  const parts = getBogotaDateTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}-05:00`;
};

export const toBogotaDateStartTimestamp = (value: string | Date) => {
  const { year, month, day } = extractYmd(value);
  return `${year}-${month}-${day}T00:00:00-05:00`;
};

export const getDayOfWeekFromDateValue = (value: string | Date) => {
  const { year, month, day } = extractYmd(value);
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();
};
