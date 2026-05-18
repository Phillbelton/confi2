import { useQuery } from '@tanstack/react-query';
import { bannerService } from '@/services/banners';
import type { BannerPlacement } from '@/types';

export function useBanners(placement: BannerPlacement) {
  return useQuery({
    queryKey: ['banners', placement],
    queryFn: () => bannerService.getByPlacement(placement),
    staleTime: 60_000,
  });
}
