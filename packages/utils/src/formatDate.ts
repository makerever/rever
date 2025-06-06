import { DateTime } from "luxon";

// Formats a date into a specified string format and optional time zone
export function formatDate(
  input: string | Date | undefined | null,
  format: string = "DD/MM/YYYY",
  timeZone?: string,
  fixedFormat?: boolean,
  includeTime?: boolean,
): string {
  if (!input) return "Invalid Date";

  // 1. Build a Luxon DateTime (in zone if provided)
  const dt = DateTime.fromJSDate(
    input instanceof Date ? input : new Date(input),
    timeZone ? { zone: timeZone } : {},
  );
  if (!dt.isValid) return "Invalid Date";

  // 2. Extract tokens in order (splitting on non-letters)
  const tokens = format.match(/[A-Za-z]+/g);
  if (!tokens) {
    // fallback to a default readable format
    return dt.toFormat("dd LLL yyyy");
  }

  // 3. Map each token to its rendered piece
  const pieces = tokens.map((tok) => {
    switch (tok) {
      case "YYYY":
        return dt.toFormat("yyyy");
      case "YY":
        return dt.toFormat("yy");
      case "DD":
        return dt.toFormat("dd");
      case "D":
        return String(dt.day);
      // always render 'MM' or 'M' as a short month name
      case "MM":
      case "M":
        return dt.toFormat("LLL");
      // if you ever want full month: 'MMMM' → dt.toFormat("LLLL")
      default:
        return tok; // unknown token: leave as-is
    }
  });

  if (fixedFormat) {
    return dt.isValid ? dt.toFormat(format) : "Invalid Date"; // Return formatted date or 'Invalid Date'
  }

  // 4. Build the final string with the comma in the right spot
  let result: string;
  if (tokens[0] === "YYYY" && pieces.length === 3) {
    // year first:
    //   [YYYY, MM, DD] → "2025, Jan 01"
    result = `${pieces[0]}, ${pieces[1]} ${pieces[2]}`;
  } else if (pieces.length === 3) {
    // anything else with 3 tokens (day/month first):
    //   [DD, MM, YYYY] → "01 Jan, 2025"
    //   [MM, DD, YYYY] → "Jan 01, 2025"
    result = `${pieces[0]} ${pieces[1]}, ${pieces[2]}`;
  } else {
    // fallback to simple space-join
    result = pieces.join(" ");
  }

  if (includeTime) {
    result += ` at ${dt.toFormat("HH:mm a")}`;
  }

  return result;
}
