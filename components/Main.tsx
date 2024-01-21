import { Noto_Sans_JP } from "@next/font/google";
import React from "react";
const notoSansJP400 = Noto_Sans_JP({ weight: '400',display:'swap',preload:false, });

export default function Main({ children }) {
  return <main className={notoSansJP400.className}>{children}</main>;
}