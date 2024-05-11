import React from "react";
import Main from "@/components/Main";
import { AppProps } from "next/app";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Main>
        <Component {...pageProps} />
      </Main>
    </>
  );
}
