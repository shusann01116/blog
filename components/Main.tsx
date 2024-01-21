/* eslint-disable react/prop-types */

import { Noto_Sans_JP } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import React from "react";
const notoSansJP400 = Noto_Sans_JP({
  weight: "400",
  display: "swap",
  preload: false,
});

export default function Main({ children }) {
  return (
    <>
      <GoogleAnalytics gaId="G-2NJX07FBDF" />
      <main className={notoSansJP400.className}>{children}</main>;
    </>
  );
}
