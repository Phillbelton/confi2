import { useQuery } from '@tanstack/react-query';
import { bannerService } from '@/services/banners';
import type { BannerPlacement } from '@/types';

export function useBanners(placement: BannerPlacement, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['banners', placement],
    queryFn: () => bannerService.getByPlacement(placement),
    staleTime: 60_000,
    enabled: opts?.enabled ?? true,
  });
}
