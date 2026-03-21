import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMyOrders, getOrderStatusConfig } from './useClientOrders';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/types/order';

const POLL_INTERVAL = 60000; // Check every 60 seconds
const STORAGE_KEY = 'order-states-cache';

interface OrderStateCache {
  [orderId: string]: {
    status: string;
    lastChecked: number;
  };
}

/**
 * Hook to monitor order status changes and show notifications
 * Only monitors active orders (not completed or cancelled)
 */
export function useOrderNotifications() {
  const { data: ordersData } = useMyOrders();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!ordersData?.data) return;

    const orders = ordersData.data;

    // Filter only active orders (not completed or cancelled)
    const activeOrders = orders.filter(
      (order: Order) =>
        order.status !== 'completed' &&
        order.status !== 'cancelled'
    );

    if (activeOrders.length === 0) {
      // No active orders, clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Load cached states from localStorage
    const loadCache = (): OrderStateCache => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        return cached ? JSON.parse(cached) : {};
      } catch {
        return {};
      }
    };

    // Save cache to localStorage
    const saveCache = (cache: OrderStateCache) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      } catch {
        // Ignore localStorage errors
      }
    };

    // Check for status changes
    const checkForChanges = () => {
      const cache = loadCache();
      const now = Date.now();
      let hasChanges = false;

      activeOrders.forEach((order: Order) => {
        const cached = cache[order._id];

        if (cached && cached.status !== order.status) {
          // Status has changed!
          const statusConfig = getOrderStatusConfig(order.status);
          const oldStatusConfig = getOrderStatusConfig(cached.status as any);

          toast({
            title: `Pedido #${order.orderNumber} actualizado`,
            description: `${oldStatusConfig.label} → ${statusConfig.label}`,
            duration: 8000,
          });

          hasChanges = true;
        }

        // Update cache
        cache[order._id] = {
          status: order.status,
          lastChecked: now,
        };
      });

      // Clean up old cached orders (older than 7 days)
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      Object.keys(cache).forEach((orderId) => {
        if (cache[orderId].lastChecked < sevenDaysAgo) {
          delete cache[orderId];
        }
      });

      if (hasChanges) {
        saveCache(cache);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      } else {
        saveCache(cache);
      }
    };

    // Initial check
    checkForChanges();

    // Set up polling
    if (!intervalRef.current) {
      intervalRef.current = setInterval(checkForChanges, POLL_INTERVAL);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ordersData, toast, queryClient]);
}
