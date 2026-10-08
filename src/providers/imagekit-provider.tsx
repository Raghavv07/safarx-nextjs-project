"use client";

import { ImageKitProvider } from "@imagekit/next";
import { type ReactNode } from "react";
import { env } from "@/env";

export interface ImageKitAppProviderProps {
  children: ReactNode;
}

/**
 * ImageKit Provider conforming to the official @imagekit/next SDK.
 * Supplies urlEndpoint to all child Image / Video components.
 */
export function ImageKitAppProvider({ children }: ImageKitAppProviderProps) {
  const urlEndpoint =
    env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/safarx";

  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>
      {children}
    </ImageKitProvider>
  );
}
