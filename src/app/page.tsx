"use client";

import GasolineCalculator from "@/components/GasolineCalculator";
import Head from "next/head";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Rodagem | Calculadora de Gasolina</title>
      </Head>
      <GasolineCalculator />
    </div>
  );
}
