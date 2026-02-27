/**
 * Date Formatting Utilities
 */

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return '—';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };

    return d.toLocaleDateString('en-US', defaultOptions);
  } catch {
    return '—';
  }
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Format as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return diffMins + (diffMins === 1 ? ' minute ago' : ' minutes ago');
    }
    if (diffHours < 24) {
      return diffHours + (diffHours === 1 ? ' hour ago' : ' hours ago');
    }
    if (diffDays < 7) {
      return diffDays + (diffDays === 1 ? ' day ago' : ' days ago');
    }

    // Fall back to formatted date
    return formatDate(d);
  } catch {
    return '—';
  }
}

/**
 * Format month/year (e.g., "January 2024")
 */
export function formatMonthYear(date: string | Date | null | undefined): string {
  if (!date) return '—';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Format date for grouping (e.g., "Today", "Yesterday", "January 15")
 */
export function formatDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, now)) {
    return 'Today';
  }

  if (isSameDay(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Format time only
 */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format ISO date for API calls
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
