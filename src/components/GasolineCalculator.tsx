import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/GasolineCalculator.module.css';
import axios from 'axios';
import { getSecret } from '@/adapter/secretManager';

const tomtomKey = 'XP89ank6XAEoPaABzg7XYtScbAp7OP1T';

interface PlaceSuggestion {
  description: string;
  lat: number;
  lon: number;
}

interface PlaceGeo {
  lat: number;
  long: number;
}

const GasolineCalculator: React.FC = () => {
  const [kmPerLiterValid, setKmPerLiterValid] = useState<boolean>(true);
  const [gasPriceValid, setGasPriceValid] = useState<boolean>(true);
  const [originValid, setOriginValid] = useState<boolean>(false);
  const [destinationValid, setDestinationValid] = useState<boolean>(false);
  const [calcSelect, setCalcSelect] = useState<boolean>(false);
  const [kmPerLiter, setKmPerLiter] = useState<string>('1');
  const [gasPrice, setGasPrice] = useState<string>('10');
  const [origin, setOrigin] = useState<string>('');
  const [originGeo, setOriginGeo] = useState<PlaceGeo | null>(null);
  const [destinationGeo, setDestinationGeo] = useState<PlaceGeo | null>(null);
  const [toll, setToll] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [center, setCenter] = useState<[number, number]>([-49.74180, -29.33022]);
  const [result, setResult] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [originSuggestions, setOriginSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [originSelect, setOriginSelect] = useState<boolean>(false);
  const [destSelect, setDestSelect] = useState<boolean>(false);
  const [routeValid, setRouteValid] = useState<boolean>(true);

  const mapElement = useRef(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [route, setRoute] = useState(null);
  const [map, setMap] = useState<tt.Map| null>(null);
  let firstRender = true;

  useEffect(() => {

    console.log('useEffect');
    console.log(map);
    if (!mapElement.current || !firstRender) return;

    firstRender = false;
    
    console.log('---- useEffect ----');

    const initTT = async () => {
      console.log('initTT');
      const tt = await import('@tomtom-international/web-sdk-maps');
      const script = document.createElement('script');
      script.src = `https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.14.0/maps/maps-web.min.js?key=${tomtomKey}`;
      script.async = true;
      script.onload = () => {
        const mapInstance = tt.map({
          key: tomtomKey,
          container: mapElement.current!,
          center: center,
          zoom: 13
        });
        setMap(mapInstance);
      };   
      
      document.head.appendChild(script);
    };

    if(!map){
      initTT();
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  useEffect(() => {
    console.log('effect route')

    const drawRoute = async () => {

      if(!map || !route || !route.legs.length) return;
      
      const tt = await import('@tomtom-international/web-sdk-maps');

      const routeCoordinates = route.legs[0].points.map(point => ({
        lat: point.latitude,
        lng: point.longitude
      }));

      const lineCoordinates = routeCoordinates.map((cor) => [cor.lng, cor.lat])

      if(calcSelect){
        if(map.getLayer('routeLine'))
          map.removeLayer('routeLine')
        if(map.getSource('routeLine'))
          map.removeSource('routeLine')
      }  

      map.addLayer({
        id: 'routeLine',
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: lineCoordinates
            }
          }
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': 'black',
          'line-width': 7
        }
      });

      const bounds = new tt.LngLatBounds();

      routeCoordinates.forEach(point => {
        bounds.extend(new tt.LngLat(point.lng, point.lat));
      });
  
      // Centraliza o mapa nos limites da rota
      map.fitBounds(bounds, { padding: 50 });
      setCenter(bounds.getCenter().toArray() as [number, number])
    }
  
    if (map && route) {
      drawRoute();
    }
  }, [map, route]);
  


  // useEffect(() => {
  //   const handleClickOutside = (event: any) => {
  //     const originInput = document.getElementById('origin-input');
  //     const destinationInput = document.getElementById('destination-input');
  //     const origSug = document.getElementById('origin-suggestion');
  //     const destSug = document.getElementById('destination-suggestion');

  //     if (
  //       originInput &&
  //       !originInput.contains(event.target) &&
  //       destinationInput &&
  //       !destinationInput.contains(event.target) &&
  //       origSug &&
  //       !origSug.contains(event.target) &&
  //       destSug &&
  //       !destSug.contains(event.target)
  //     ) {
  //       if (originSuggestions.length > 0) {
  //         setOriginValid(false);
  //       }
  //       if (destinationSuggestions.length > 0) {
  //         setDestinationValid(false);
  //       }
  //       setOriginSuggestions([]);
  //       setDestinationSuggestions([]);
  //     }
  //   };

  //   document.addEventListener('click', handleClickOutside);

  //   return () => {
  //     document.removeEventListener('click', handleClickOutside);
  //   };
  // }, [destinationSuggestions.length, originSuggestions.length]);

  const validateFields = () => {
    let isValid = true;

    if (!kmPerLiter || isNaN(parseFloat(kmPerLiter))) {
      setKmPerLiterValid(false);
      isValid = false;
    } else {
      setKmPerLiterValid(true);
    }

    if (!gasPrice || isNaN(parseFloat(gasPrice))) {
      setGasPriceValid(false);
      isValid = false;
    } else {
      setGasPriceValid(true);
    }

    if (!origin) {
      setOriginValid(false);
      isValid = false;
    } else {
      setOriginValid(true);
    }

    if (!destination) {
      setDestinationValid(false);
      isValid = false;
    } else {
      setDestinationValid(true);
    }

    return isValid;
  };

  const calculateGasCost = async (): Promise<void> => {
    const km: number = parseFloat(kmPerLiter);
    const price: number = parseFloat(gasPrice);

    if (!isNaN(km) && !isNaN(price) && origin.length > 2 && destination.length > 2) {
      const distance: number = await getDistance(origin, destination) || 0;
      setDistance(distance);
      const cost: number = ((distance / km) * price) + (toll ? Number(toll) : 0);
      setResult(Number(cost.toFixed(2)));
    }
  };

  const getDistance = async (origin: string, destination: string) => {
    try {

      const response = await axios.get(
        `https://api.tomtom.com/routing/1/calculateRoute/${originGeo?.lat},${originGeo?.long}:${destinationGeo?.lat},${destinationGeo?.long}/json?key=${tomtomKey}&routeType=fastest&traffic=true`
      );

      console.log('Distance');
      console.log(response);

      if (response.data && response.data.routes && response.data.routes[0].summary) {
        console.log('setRoute');
        setRoute(response.data.routes[0]);
        return response.data.routes[0].summary.lengthInMeters / 1000;
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

    if (value.length < 3) {
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

    if (value.length < 3) {
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
    setSuggestions: React.Dispatch<React.SetStateAction<PlaceSuggestion[]>>
  ): Promise<void> => {
    try {
      const response = await axios.get(
        `https://api.tomtom.com/search/2/search/${query}.json?key=${tomtomKey}`
      );

      if (response.data.results) {
        const suggestions: PlaceSuggestion[] = response.data.results.map((result: any) => {
          return {
            description: result.address.freeformAddress,
            lat: result.position.lat,
            lon: result.position.lon
          };
        });
        setSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões de lugares:', error);
    }
  };

  const handleSuggestionClick = (
    place: PlaceSuggestion,
    setField: React.Dispatch<React.SetStateAction<string>>,
    setSuggestions: React.Dispatch<React.SetStateAction<PlaceSuggestion[]>>,
    setSelect: React.Dispatch<React.SetStateAction<boolean>>,
    setValidPlace: React.Dispatch<React.SetStateAction<boolean>>,
    setGeoPlace: React.Dispatch<React.SetStateAction<PlaceGeo | null>>
  ): void => {
    setField(place.description);
    setSuggestions([]);
    setSelect(true);
    setValidPlace(true);
    setGeoPlace({
      lat: place.lat,
      long: place.lon
    })
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
        <h1 style={{ fontWeight: 'bold', fontSize: '15pt', marginBottom: '2%' }}>Rodagem - Calculadora de Gasolina</h1>
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
                      setOriginValid,
                      setOriginGeo
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
                <li key={index} onClick={() => handleSuggestionClick(place, setDestination, setDestinationSuggestions, setDestSelect, setDestinationValid, setDestinationGeo)}>
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
            <div style={{ float: 'left', marginRight: '3%' }}>
              <b>Custo da Viagem: </b>
              <span style={{ color: 'red' }}>R${result.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
      <div className={styles.mapContainer} style={{ height: '400px', width: '100%', marginTop: '20px' }}>
        <div ref={mapElement} id="map" style={{ height: '400px', width: '100%'}}> </div>
      </div>
    </div>
  );
};

export default GasolineCalculator;
