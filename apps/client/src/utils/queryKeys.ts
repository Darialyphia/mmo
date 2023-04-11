import type { ApiQueryKey } from '@/composables/useApi';
import type { AnyObject } from '@mmo/shared';

export const queryKeys = {
  ME: ['me'],
  PING: ['ping'],
  LOGIN: ['login'],
  LOGOUT: ['logout'],
  ASK_FOR_PASSWORD_RESET: ['ask for password reset'],
  RESET_PASSWORD: ['reset password']
} satisfies Record<string, ApiQueryKey<AnyObject>>;
