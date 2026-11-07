"use client";

import { createContext, useContext, useState } from "react";
import type { Product } from "@/lib/domain/types";
import { ProductFormDialog } from "./product-form-dialog";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; product: Product }
  | null;

interface ProductDialogContextValue {
  openCreate: () => void;
  openEdit: (product: Product) => void;
}

const ProductDialogContext = createContext<ProductDialogContextValue | null>(null);

export function ProductDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);

  return (
    <ProductDialogContext.Provider
      value={{
        openCreate: () => setDialog({ mode: "create" }),
        openEdit: (product) => setDialog({ mode: "edit", product }),
      }}
    >
      {children}
      {dialog ? (
        <ProductFormDialog
          key={dialog.mode === "edit" ? dialog.product.id : "create"}
          product={dialog.mode === "edit" ? dialog.product : undefined}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </ProductDialogContext.Provider>
  );
}

export function useProductDialog(): ProductDialogContextValue {
  const context = useContext(ProductDialogContext);
  if (!context) {
    throw new Error("useProductDialog должен использоваться внутри ProductDialogProvider");
  }
  return context;
}
