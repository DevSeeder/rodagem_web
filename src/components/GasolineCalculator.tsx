import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/GasolineCalculator.module.css';
import Head from 'next/head';
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';

interface PlaceSuggestion {
  description: string;
}

const GasolineCalculator: React.FC = () => {
  const [kmPerLiterValid, setKmPerLiterValid] = useState<boolean>(true);
  const [gasPriceValid, setGasPriceValid] = useState<boolean>(true);
  const [originValid, setOriginValid] = useState<boolean>(false);
  const [destinationValid, setDestinationValid] = useState<boolean>(false);
  const [calcSelect, setCalcSelect] = useState<boolean>(false);


  const [kmPerLiter, setKmPerLiter] = useState<string>('');
  const [gasPrice, setGasPrice] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [toll, setToll] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [center, setCenter] = useState<{lat: number, lng: number}>({lat: -34.397, lng: 150.644 });
  const [result, setResult] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [directions, setDirections] = useState<any>(null);
  const [originSelect, setOriginSelect] = useState<boolean>(false);
  const [destSelect, setDestSelect] = useState<boolean>(false);
  const [routeValid, setRouteValid] = useState<boolean>(true);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      const originInput = document.getElementById('origin-input'); 
      const destinationInput = document.getElementById('destination-input'); 
      const origSug = document.getElementById('origin-suggestion'); 
      const destSug = document.getElementById('destination-suggestion'); 
  
      if (
        originInput && 
        !originInput.contains(event.target) &&
        destinationInput && 
        !destinationInput.contains(event.target) &&
        origSug && 
        !origSug.contains(event.target) &&
        destSug && 
        !destSug.contains(event.target)
      ) {
        if(originSuggestions.length > 0){
          setOriginValid(false);
        }
        if(destinationSuggestions.length > 0){
          setDestinationValid(false);
        }
        setOriginSuggestions([]);
        setDestinationSuggestions([]);
      }
    };
  
    document.addEventListener('click', handleClickOutside);
  
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const validateFields = () => {
    let isValid = true;
  
    if (!kmPerLiter || isNaN(parseFloat(kmPerLiter))) {
      setKmPerLiterValid(false);
      isValid = false;
      return;
    } else {
      setKmPerLiterValid(true);
    }
  
    if (!gasPrice || isNaN(parseFloat(gasPrice))) {
      setGasPriceValid(false);
      isValid = false;
      return;
    } else {
      setGasPriceValid(true);
    }
  
    if (!origin) {
      setOriginValid(false);
      isValid = false;
      return;
    } else {
      setOriginValid(true);
    }
  
    if (!destination) {
      setDestinationValid(false);
      isValid = false;
      return;
    } else {
      setDestinationValid(true);
    }
  
    return isValid;
  };
  
  

  const calculateGasCost = async (): Promise<void> => {

    const km: number = parseFloat(kmPerLiter);
    const price: number = parseFloat(gasPrice);
    


    if (!isNaN(km) && !isNaN(price) && origin.length > 2 && destination.length > 2) {
      const distance: number = await getDistance(origin, destination); 
      setDistance(distance);     
      const cost: number = ((distance / km) * price) + (toll ? Number(toll) : 0);
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

      console.log(response);

      const route = response.data.routes[0];
      const bounds = route.bounds;
      
      // Obtendo o centro das coordenadas
      const center = {
        lat: (bounds.northeast.lat + bounds.southwest.lat) / 2,
        lng: (bounds.northeast.lng + bounds.southwest.lng) / 2
      };
      setRouteValid(true)
      setCenter(center);
    } catch (error) {
      console.error('Erro ao obter a distância:', error);
      setRouteValid(false)
    }
  };

  const getDistance = async (origin: string, destination: string) => {    

    try {
      const response = await axios.get(
        `maps/maps/api/distancematrix/json?units=metric&origins=${origin}&destinations=${destination}&key=AIzaSyA1jWfFTMpNv7SlxwaAQPphr3_ya8GqPh0`
      );

      console.log(response);


      if (response.data && response.data.rows.length > 0 && response.data.rows[0].elements.length > 0) {
        return response.data.rows[0].elements[0].distance.value / 1000; // Em quilômetros
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

  const searchPlaces = async (
    query: string, 
    setSuggestions: React.Dispatch<React.SetStateAction<PlaceSuggestion[]>>): Promise<void> => {    

    try {
      const response = await axios.get(
        `/maps/maps/api/place/autocomplete/json?input=${query}&types=(cities)&key=AIzaSyA1jWfFTMpNv7SlxwaAQPphr3_ya8GqPh0`
        );

      if (response.data.predictions) {
        const suggestions: PlaceSuggestion[] = response.data.predictions;
        setSuggestions(suggestions);
        return;
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
    }
  };

  const handleSuggestionClick = (
    place: PlaceSuggestion, 
    setField: React.Dispatch<React.SetStateAction<string>>, 
    setSuggestions: React.Dispatch<React.SetStateAction<PlaceSuggestion[]>>,
    setSelect: React.Dispatch<React.SetStateAction<boolean>>,
    setValidPlace: React.Dispatch<React.SetStateAction<boolean>>
  ): void => {    
    setDirections(null);
    setField(place.description);
    setSuggestions([]);
    setSelect(true)
    setValidPlace(true);
  };

  const handleButtonClick = (): void => {
    setCalcSelect(true);
    const isValid = validateFields();

    if (isValid) {
      calculateGasCost();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 style={{fontWeight: 'bold', fontSize: '15pt', marginBottom: '2%'}}>Rodagem - Calculadora de Gasolina</h1>
        <div className={styles.inputContainer}>
          <label className={styles.label}>
            KM / Litro
            <input
              type="number"
              value={kmPerLiter}
              required={true}
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
              id='origin-input'
            />
            <ul 
              className={`${styles.suggestions} ${originSelect ? styles.show : ''}`}
              id='origin-suggestion'
            >
              {originSuggestions.map((place, index) => (
                <li
                  key={index}
                  onClick={() =>
                    handleSuggestionClick(
                      place,
                      setOrigin,
                      setOriginSuggestions,
                      setOriginSelect,
                      setOriginValid
                    )
                  }
                >
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
              id='destination-input'
            />
            <ul className={styles.suggestions} id='destination-suggestion'>
              {destinationSuggestions.map((place, index) => (
                <li key={index} onClick={() => handleSuggestionClick(place, setDestination, setDestinationSuggestions, setDestSelect, setDestinationValid)}>
                  {place.description}
                </li>
              ))}
            </ul>
          </label>
        </div>
        <div className={styles.inputContainer}>
          <label className={styles.label}>
            Pedágio
            <input
              type="number"
              value={toll}
              onChange={(e) => setToll(e.target.value)}
              className={styles.inputField}
            />
          </label>
        </div>
        <button onClick={handleButtonClick} className={styles.button}>
          Calcular
        </button>
        {result !== null && (
          <div className={styles.result}>
            <div style={{ float: 'left', marginRight: '3%'}}>
              <b>Custo da Viagem: </b>
              <span style={{ color: 'red'}}>R${result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <b>Distância: </b>
              <span style={{ }}>{distance} Km</span>
            </div>
          </div>
        )}
        {!kmPerLiterValid && <div className={styles.error}>Por favor, insira um valor válido para KM / Litro.</div>}
        {!gasPriceValid && <div className={styles.error}>Por favor, insira um valor válido para o preço da gasolina.</div>}
        {!routeValid && <div className={styles.error}>A rota de Origem e Destino é inválida.</div>}
        {(!originValid || !originSelect) && calcSelect && <div className={styles.error}>Por favor, insira uma origem válida.</div>}
        {(!destinationValid || !destSelect) && calcSelect && <div className={styles.error}>Por favor, insira um destino válido.</div>}

      </div>
      {origin && destination && (
        <div className={styles.mapContainer} style={{ height: '400px', width: '100%', marginTop: '20px' }}>
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
                  if(res?.routes.length === 0){
                    setDirections(null);
                    if(
                      originValid &&
                      destinationValid &&
                      calcSelect &&
                      destSelect &&
                      originSelect
                    ){
                      console.log('invalid routes '+ origin + ' -> ' +destination);
                      setRouteValid(false);
                    }
                    return;
                  }
                  setDirections(res)
                  setRouteValid(true)
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
