import React, { useRef, useState } from 'react';
import styles from '../styles/GasolineCalculator.module.css';
import Head from 'next/head';
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';

interface PlaceSuggestion {
  description: string;
}

const GasolineCalculator: React.FC = () => {
  const [kmPerLiter, setKmPerLiter] = useState<string>('');
  const [gasPrice, setGasPrice] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [center, setCenter] = useState<{lat: number, lng: number}>({lat: -34.397, lng: 150.644 });
  const [result, setResult] = useState<number>(0);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [directions, setDirections] = useState<any>(null);
  const [originSelect, setOriginSelect] = useState<boolean>(false);
  const [destSelect, setDestSelect] = useState<boolean>(false);

  const calculateGasCost = async (): Promise<void> => {
    const km: number = parseFloat(kmPerLiter);
    const price: number = parseFloat(gasPrice);
    


    if (!isNaN(km) && !isNaN(price) && origin.length > 2 && destination.length > 2) {
      const distance: number = await getDistance(origin, destination);      
      const cost: number = (distance / km) * price;
      setResult(Number(cost.toFixed(2)));
      await getDirections(origin, destination);
    }
  };

  const getDirections = async (origin: string, destination: string) => {
    try {      
      setDirections(null); 
      const response = await axios.get(
        `/maps/maps/api/directions/json?origin=${origin}&destination=${destination}&key=AIzaSyA1jWfFTMpNv7SlxwaAQPphr3_ya8GqPh0`
      );
      const route = response.data.routes[0];
      const bounds = route.bounds;
      
      // Obtendo o centro das coordenadas
      const center = {
        lat: (bounds.northeast.lat + bounds.southwest.lat) / 2,
        lng: (bounds.northeast.lng + bounds.southwest.lng) / 2
      };

      setCenter(center);
    } catch (error) {
      console.error('Erro ao obter a distância:', error);
      throw error;
    }
  };

  const getDistance = async (origin: string, destination: string) => {    

    try {
      const response = await axios.get(
        `maps/maps/api/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=AIzaSyA1jWfFTMpNv7SlxwaAQPphr3_ya8GqPh0`
      );

      if (response.data && response.data.rows.length > 0 && response.data.rows[0].elements.length > 0) {
        return response.data.rows[0].elements[0].distance.value / 1000; // Em quilômetros
      } else {
        throw new Error('Erro ao obter a distância.');
      }
    } catch (error) {
      console.error('Erro ao obter a distância:', error);
      throw error;
    }
  };

  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>): void => {    

    const value: string = e.target.value;
    setOrigin(value);
    setOriginSelect(false);

    if(value.length < 3){
      return;
    }

    if (value.trim() !== '') {
      searchPlaces(value, setOriginSuggestions);
    } else {
      setOriginSuggestions([]);
    }
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>): void => {    
    const value: string = e.target.value;

    setDestination(value);
    setDestSelect(false);

    if(value.length < 3){
      return;
    }

    if (value.trim() !== '') {
      searchPlaces(value, setDestinationSuggestions);
    } else {
      setDestinationSuggestions([]);
    }
  };

  const searchPlaces = async (query: string, setSuggestions: React.Dispatch<React.SetStateAction<PlaceSuggestion[]>>): Promise<void> => {    

    try {
      const response = await axios.get(
        `/maps/maps/api/place/autocomplete/json?input=${query}&types=(cities)&key=AIzaSyA1jWfFTMpNv7SlxwaAQPphr3_ya8GqPh0`
        );

      if (response.data.predictions) {
        const suggestions: PlaceSuggestion[] = response.data.predictions;
        setSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
    }
  };

  const handleSuggestionClick = (
    place: PlaceSuggestion, 
    setField: React.Dispatch<React.SetStateAction<string>>, 
    setSuggestions: React.Dispatch<React.SetStateAction<PlaceSuggestion[]>>,
    setSelect: React.Dispatch<React.SetStateAction<boolean>>
  ): void => {    
    setField(place.description);
    setSuggestions([]);
    setSelect(true)
  };

  const handleButtonClick = (): void => {
    calculateGasCost();
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Calculadora de Gasolina</title>
      </Head>
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
          Origem:
          <input
            type="text"
            value={origin}
            onChange={handleOriginChange}
            className={styles.inputField}
          />
          <ul className={styles.suggestions}>
            {originSuggestions.map((place, index) => (
              <li key={index} onClick={() => handleSuggestionClick(
                  place, setOrigin, setOriginSuggestions, setOriginSelect
                )}>
                {place.description}
              </li>
            ))}
          </ul>
        </label>
      </div>
      <div className={styles.inputContainer}>
        <label className={styles.label}>
          Destino:
          <input
            type="text"
            value={destination}
            onChange={handleDestinationChange}
            className={styles.inputField}
          />
          <ul className={styles.suggestions}>
            {destinationSuggestions.map((place, index) => (
              <li key={index} onClick={() => handleSuggestionClick(place, setDestination, setDestinationSuggestions, setDestSelect)}>
                {place.description}
              </li>
            ))}
          </ul>
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
      {origin && destination && (
        <div style={{ height: '400px', width: '100%', marginTop: '20px' }}>
          <LoadScript googleMapsApiKey="AIzaSyA1jWfFTMpNv7SlxwaAQPphr3_ya8GqPh0">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              zoom={12}
              options={{
                styles: [

                ],
              }}
              center={center}
            >
              <DirectionsService
                options={{ 
                  destination: destination,
                  origin: origin,
                  travelMode: TravelMode.DRIVING,
                }}
                callback={(res) => {
                  setDirections(res)
                }}
              />
              {originSelect && destSelect && directions && (
                <DirectionsRenderer 
                  options={{
                    directions: directions,
                    markerOptions: {
                      icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: 'black',
                        fillOpacity: 1,
                        scale: 5,
                        strokeWeight: 0           
                      }
                    },
                    polylineOptions: {
                      strokeColor: '#000000', 
                    },
                  }}
                />
              )}
            </GoogleMap>
          </LoadScript>
        </div>
      )}
    </div>
  );
};

export default GasolineCalculator;

export enum TravelMode {
  BICYCLING = 'BICYCLING',
  DRIVING = 'DRIVING',
  TRANSIT = 'TRANSIT',
  WALKING = 'WALKING',
}
