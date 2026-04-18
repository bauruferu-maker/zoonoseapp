import React, { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet } from 'react-native'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning'
  visible: boolean
  onHide: () => void
  duration?: number
}

export default function Toast({ message, type, visible, onHide, duration = 3000 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(-20)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start()

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide())
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible, duration, onHide])

  if (!visible) return null

  const colors = {
    success: { bg: '#16a34a', icon: '✅' },
    error: { bg: '#DC2626', icon: '❌' },
    warning: { bg: '#F59E0B', icon: '⚠️' },
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors[type].bg, opacity, transform: [{ translateY }] }]}>
      <Text style={styles.text}>{colors[type].icon} {message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 100,
    borderRadius: 12,
    padding: 14,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
})
