import { useState } from 'react';
import styles from '../styles/GasolineCalculator.module.css';
import Head from 'next/head';

const GasolineCalculator = () => {
  const [kmPerLiter, setKmPerLiter] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [distance, setDistance] = useState('');
  const [result, setResult] = useState(0);

  const calculateGasCost = () => {
    const km = parseFloat(kmPerLiter);
    const price = parseFloat(gasPrice);
    const dist = parseFloat(distance);

    if (!isNaN(km) && !isNaN(price) && !isNaN(dist)) {
      const cost = (dist / km) * price;
      setResult(Number(cost.toFixed(2)));
    }
  };

  const handleButtonClick = () => {
    calculateGasCost();
  };

  return (
    <div className={styles.container}>
      <h2>Rodagem - Calculadora de Gasolina</h2>
      <div className={styles.inputContainer}>
        <label className={styles.label}>
          KM / Litro
          <input
            type="number"
            value={kmPerLiter}
            onChange={(e) => setKmPerLiter(e.target.value)}
            className={styles.inputField}
          />
        </label>
      </div>
      <div className={styles.inputContainer}>
        <label className={styles.label}>
          Gasolina Preço por Litro (R$):
          <input
            type="number"
            value={gasPrice}
            onChange={(e) => setGasPrice(e.target.value)}
            className={styles.inputField}
          />
        </label>
      </div>
      <div className={styles.inputContainer}>
        <label className={styles.label}>
          Distância em Quilômetros:
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className={styles.inputField}
          />
        </label>
      </div>
      <button onClick={handleButtonClick} className={styles.button}>
        Calcular
      </button>
      {result !== null && (
        <div className={styles.result}>
          <h3>Custo da Viagem:</h3>
          <p>R${result}</p>
        </div>
      )}
    </div>
  );
};

export default GasolineCalculator;
