import { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import React from "react";

export default function Nextra({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <Link
          rel="alternate"
          type="application/rss+xml"
          title="RSS"
          href="/feed.xml"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
