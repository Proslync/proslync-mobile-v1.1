import { format, parseISO } from 'date-fns';

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function to12Hour(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr}${ampm}`;
}

/**
 * "Sunday, January 15 at 9:00PM" or "Sunday, January 15 at 9:00PM at Venue Name"
 */
export function formatEventDate(dateString: string, venueName?: string): string {
  try {
    const date = new Date(dateString);
    const dayName = DAYS_FULL[date.getDay()];
    const monthName = MONTHS_FULL[date.getMonth()];
    const dayNum = date.getDate();

    let result = `${dayName}, ${monthName} ${dayNum} at ${to12Hour(date)}`;
    if (venueName) {
      result += ` at ${venueName}`;
    }
    return result;
  } catch {
    return dateString;
  }
}

/**
 * Compact relative timestamp: "now", "5m", "2h", "3d", or "Mar 5"
 */
export function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * "3:45 PM" — 12-hour time with minutes
 */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * "5m ago", "2h ago", "3d ago"
 */
export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * "9:00 AM - 2:00 AM" — time range using date-fns
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  try {
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  } catch {
    return 'Time TBD';
  }
}

/**
 * "Today" / "Yesterday" / "Monday" / "Wed, Mar 10"
 */
export function formatDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (inputDate.getTime() === today.getTime()) {
    return 'Today';
  }
  if (inputDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  const diffDays = Math.floor((today.getTime() - inputDate.getTime()) / 86400000);
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
