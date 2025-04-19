"use client"

import { createContext, useState, useEffect, useContext } from "react"
import Geolocation from "react-native-geolocation-service"
import { Platform, PermissionsAndroid, Alert } from "react-native"

const LocationContext = createContext(null)

export const useLocation = () => useContext(LocationContext)

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isLocationLoading, setIsLocationLoading] = useState(true)

  useEffect(() => {
    requestLocationPermission()
  }, [])

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === "ios") {
        const granted = await Geolocation.requestAuthorization("whenInUse")
        if (granted === "granted") {
          getCurrentLocation()
        } else {
          setLocationError("Location permission denied")
          setIsLocationLoading(false)

          // Set default Mumbai location
          setDefaultMumbaiLocation()
        }
      } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
          title: "Location Permission",
          message: "Khana Khazana needs access to your location to show nearby street food vendors.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        })
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation()
        } else {
          setLocationError("Location permission denied")
          setIsLocationLoading(false)

          // Set default Mumbai location
          setDefaultMumbaiLocation()
        }
      }
    } catch (err) {
      console.warn(err)
      setLocationError("Error requesting location permission")
      setIsLocationLoading(false)

      // Set default Mumbai location
      setDefaultMumbaiLocation()
    }
  }

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCurrentLocation({ latitude, longitude })
        setIsLocationLoading(false)
      },
      (error) => {
        console.log(error.code, error.message)
        setLocationError("Unable to get current location")
        setIsLocationLoading(false)

        // Set default Mumbai location
        setDefaultMumbaiLocation()
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  }

  const setDefaultMumbaiLocation = () => {
    // Default to Mumbai city center coordinates
    setCurrentLocation({
      latitude: 19.076,
      longitude: 72.8777,
    })

    Alert.alert(
      "Location Access Required",
      "We're using a default Mumbai location. For the best experience with nearby vendors, please enable location access in your device settings.",
      [{ text: "OK", onPress: () => console.log("OK Pressed") }],
    )
  }

  const value = {
    currentLocation,
    locationError,
    isLocationLoading,
    refreshLocation: getCurrentLocation,
  }

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}
