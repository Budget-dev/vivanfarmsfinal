"use client";

import React from 'react';
import { ProductCategoryManager } from '@/components/admin/ProductCategoryManager';

export default function AdminProductsPage() {
  return (
    <ProductCategoryManager 
      category="all"
      title="Master Product Catalog"
      description="Compact inventory management, 9:16 video reels, and bulk operations across all categories."
    />
  );
}
