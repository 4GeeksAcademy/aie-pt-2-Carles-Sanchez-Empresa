"use client";

import { useState, useCallback } from "react";
import {
  fetchProducts,
  createProduct,
  createInboundOrder,
  createOutboundOrder,
  fetchOrders,
  type SKUItem,
  type SKUCreateInput,
  type StockEntryInput,
  type StockExitInput,
  type Movement,
} from "@/services/api";

export function useInventory() {
  const [products, setProducts] = useState<SKUItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (filters?: { warehouse?: string; category?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos");
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(async (data: SKUCreateInput) => {
    setError(null);
    try {
      const result = await createProduct(data);
      setProducts((prev) => [...prev, result]);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear producto";
      setError(msg);
      throw err;
    }
  }, []);

  const loadMovements = useCallback(async (warehouse?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders(warehouse);
      setMovements(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }, []);

  const registerInbound = useCallback(async (data: StockEntryInput) => {
    setError(null);
    try {
      const result = await createInboundOrder(data);
      await loadProducts();
      await loadMovements();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar entrada";
      setError(msg);
      throw err;
    }
  }, [loadProducts, loadMovements]);

  const registerOutbound = useCallback(async (data: StockExitInput) => {
    setError(null);
    try {
      const result = await createOutboundOrder(data);
      await loadProducts();
      await loadMovements();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar salida";
      setError(msg);
      throw err;
    }
  }, [loadProducts, loadMovements]);

  return {
    products,
    movements,
    loading,
    error,
    loadProducts,
    addProduct,
    loadMovements,
    registerInbound,
    registerOutbound,
  };
}