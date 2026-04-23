import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import InformationOrganisme from '../InformationOrganisme';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: { hostUri: 'localhost:8081' }
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Heart: () => 'HeartIcon',
  Shield: () => 'ShieldIcon',
  Sword: () => 'SwordIcon',
  ChevronsUp: () => 'ChevronsUpIcon'
}));

// Mock WaitingComponent
jest.mock('../WaitingComponent', () => {
  const { Text } = require('react-native');
  return () => <Text testID="waiting-component">Chargement...</Text>;
});

// Mock CardInformationStatAnimal
jest.mock('../CardInformationStatAnimal', () => {
  const { Text } = require('react-native');
  return ({ title }) => <Text testID={`stat-${title}`}>{title}</Text>;
});

describe('InformationOrganisme Component', () => {
  const mockPhoto = { base64: 'mockbase64data', uri: 'file://mockuri' };
  
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders nothing if photo is not provided', () => {
    const { toJSON } = render(<InformationOrganisme photo={null} />);
    expect(toJSON()).toBeNull();
  });

  it('calls classification API on mount and shows loading', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ success: true, common_name: 'Chat' })
    });

    const { getByTestId } = render(<InformationOrganisme photo={mockPhoto} />);
    
    // Should show loading component immediately
    expect(getByTestId('waiting-component')).toBeTruthy();
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('displays organism details and calls onFinish on success', async () => {
    const mockOnFinish = jest.fn();
    const mockData = {
      success: true,
      common_name: 'Pikachu',
      scientific_name: 'Mouse Pokémon',
      sharpness_rank: 'A',
      final_stats: { hp: 35, atk: 55, defense: 40, speed: 90 }
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockData)
    });

    const { getByText, queryByTestId } = render(
      <InformationOrganisme photo={mockPhoto} onFinish={mockOnFinish} />
    );

    // Wait for the fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Advance the 2s timeout
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Wait for the UI to update with results
    await waitFor(() => {
      expect(queryByTestId('waiting-component')).toBeNull();
      expect(getByText('Pikachu')).toBeTruthy();
      expect(getByText('Mouse Pokémon')).toBeTruthy();
      expect(getByText('A')).toBeTruthy();
      expect(getByText('Ajouter à la Collection')).toBeTruthy();
    });

    expect(mockOnFinish).toHaveBeenCalledTimes(1);
  });

  it('displays error and calls onFinish on API failure', async () => {
    const mockOnFinish = jest.fn();
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ success: false, error: 'Internal Server Error' })
    });

    const { getByText, queryByText, queryByTestId } = render(
      <InformationOrganisme photo={mockPhoto} onFinish={mockOnFinish} />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(queryByTestId('waiting-component')).toBeNull();
      expect(getByText('Internal Server Error')).toBeTruthy();
      expect(queryByText('Ajouter à la Collection')).toBeNull();
    });

    expect(mockOnFinish).toHaveBeenCalledTimes(1);
  });

  it('calls addToDex when accept button is clicked', async () => {
    const mockAddToDex = jest.fn();
    const mockData = { success: true, common_name: 'Chat' };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockData)
    });

    const { getByText } = render(
      <InformationOrganisme photo={mockPhoto} addToDex={mockAddToDex} onFinish={jest.fn()} />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    const acceptButton = await waitFor(() => getByText('Ajouter à la Collection'));
    fireEvent.press(acceptButton);

    expect(mockAddToDex).toHaveBeenCalledWith(mockData);
  });
});
