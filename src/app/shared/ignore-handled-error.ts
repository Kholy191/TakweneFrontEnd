import { EMPTY, catchError } from 'rxjs';

// The error interceptor already showed a toast, so the subscriber just stops.
export const ignoreHandledError = <T>() => catchError<T, typeof EMPTY>(() => EMPTY);
