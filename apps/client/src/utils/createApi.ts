import { createHttpService } from '@/services/http.service';

export const createApiClient = ({ getLang }: { getLang: () => string }) => {
  const httpService = createHttpService({ getLang });

  return {};
};

export type ApiClient = ReturnType<typeof createApiClient>;
