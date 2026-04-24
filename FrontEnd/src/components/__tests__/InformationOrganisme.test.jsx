import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
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

// Mock WaitingComponent — on garde un placeholder testable.
jest.mock('../WaitingComponent', () => {
  const { Text } = require('react-native');
  return ({ status }) => <Text testID="waiting-component">Chargement... {status || ''}</Text>;
});

// Mock CardInformationStatAnimal
jest.mock('../CardInformationStatAnimal', () => {
  const { Text } = require('react-native');
  return ({ title }) => <Text testID={`stat-${title}`}>{title}</Text>;
});

const JOB_ID = 'job-abc-123';

function mockSubmitResponse({ status = 'queued', queue } = {}) {
  return {
    ok: true,
    status: 202,
    text: async () =>
      JSON.stringify({
        success: true,
        job_id: JOB_ID,
        status,
        queue: queue || { position: 1, queued_total: 1, processing_total: 0, max_workers: 8 },
      }),
  };
}

function mockStatusDone(resultPayload) {
  return {
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        success: true,
        job_id: JOB_ID,
        status: 'done',
        queue: { position: 0, queued_total: 0, processing_total: 1, max_workers: 8 },
        result: resultPayload,
      }),
  };
}

function mockStatusError(errorMsg) {
  return {
    ok: false,
    status: 500,
    text: async () =>
      JSON.stringify({
        success: true,
        job_id: JOB_ID,
        status: 'error',
        error: errorMsg,
      }),
  };
}

describe('InformationOrganisme Component', () => {
  const mockPhoto = { base64: 'mockbase64data', uri: 'file://mockuri' };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if photo is not provided', () => {
    const { toJSON } = render(<InformationOrganisme photo={null} />);
    expect(toJSON()).toBeNull();
  });

  it('submits and polls until result is ready', async () => {
    const mockOnFinish = jest.fn();
    const mockData = {
      success: true,
      common_name: 'Pikachu',
      scientific_name: 'Mouse Pokémon',
      sharpness_rank: 'A',
      final_stats: { hp: 35, atk: 55, defense: 40, speed: 90 },
    };

    global.fetch
      .mockResolvedValueOnce(mockSubmitResponse({ status: 'queued' }))
      .mockResolvedValueOnce(mockStatusDone(mockData));

    const { getByText, queryByTestId } = render(
      <InformationOrganisme photo={mockPhoto} onFinish={mockOnFinish} />
    );

    expect(queryByTestId('waiting-component')).toBeTruthy();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    const [submitCall, statusCall] = global.fetch.mock.calls;
    expect(submitCall[0]).toContain('/classification');
    expect(statusCall[0]).toContain(`/classification/status/${JOB_ID}`);

    await waitFor(() => {
      expect(queryByTestId('waiting-component')).toBeNull();
      expect(getByText('Pikachu')).toBeTruthy();
      expect(getByText('Mouse Pokémon')).toBeTruthy();
      expect(getByText('A')).toBeTruthy();
      expect(getByText('Ajouter à la Collection')).toBeTruthy();
    });

    expect(mockOnFinish).toHaveBeenCalledTimes(1);
  });

  it('shows the business error when result.success === false', async () => {
    const mockOnFinish = jest.fn();
    global.fetch
      .mockResolvedValueOnce(mockSubmitResponse())
      .mockResolvedValueOnce(
        mockStatusDone({
          success: false,
          is_organism: false,
          message: "L'image ne correspond pas à un organisme vivant",
        })
      );

    const { getByText, queryByText, queryByTestId } = render(
      <InformationOrganisme photo={mockPhoto} onFinish={mockOnFinish} />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(queryByTestId('waiting-component')).toBeNull();
      expect(getByText("L'image ne correspond pas à un organisme vivant")).toBeTruthy();
      expect(queryByText('Ajouter à la Collection')).toBeNull();
    });

    expect(mockOnFinish).toHaveBeenCalledTimes(1);
  });

  it('shows the error when status returns error', async () => {
    const mockOnFinish = jest.fn();
    global.fetch
      .mockResolvedValueOnce(mockSubmitResponse())
      .mockResolvedValueOnce(mockStatusError('Internal Server Error'));

    const { getByText, queryByTestId } = render(
      <InformationOrganisme photo={mockPhoto} onFinish={mockOnFinish} />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    await waitFor(() => {
      expect(queryByTestId('waiting-component')).toBeNull();
      expect(getByText('Internal Server Error')).toBeTruthy();
    });

    expect(mockOnFinish).toHaveBeenCalledTimes(1);
  });

  it('calls addToDex with the result payload when accepted', async () => {
    const mockAddToDex = jest.fn();
    const mockData = { success: true, common_name: 'Chat' };

    global.fetch
      .mockResolvedValueOnce(mockSubmitResponse())
      .mockResolvedValueOnce(mockStatusDone(mockData));

    const { getByText } = render(
      <InformationOrganisme photo={mockPhoto} addToDex={mockAddToDex} onFinish={jest.fn()} />
    );

    const acceptButton = await waitFor(() => getByText('Ajouter à la Collection'));
    fireEvent.press(acceptButton);

    expect(mockAddToDex).toHaveBeenCalledWith(mockData);
  });
});
