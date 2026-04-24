import React from 'react';
import { render } from '@testing-library/react-native';
import WaitingComponent from '../WaitingComponent';
import fr from '../../assets/locales/fr.json';

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, colors, ...rest }) => (
      <View testID="gradient" {...rest} data-colors={Array.isArray(colors) ? colors.join(',') : ''}>
        {children}
      </View>
    ),
  };
});

jest.mock('lucide-react-native', () => {
  const { Text } = require('react-native');
  return {
    ScanLine: () => <Text testID="icon-scan">ScanLineIcon</Text>,
    Hourglass: () => <Text testID="icon-hourglass">HourglassIcon</Text>,
  };
});

describe('WaitingComponent', () => {
  it('affiche par défaut le titre "analyzing" et l\'icône scan', () => {
    const { getByText, getByTestId, queryByTestId } = render(<WaitingComponent />);
    expect(getByText(fr.waitingScreen.analyzing)).toBeTruthy();
    expect(getByText(fr.waitingScreen.description)).toBeTruthy();
    expect(getByTestId('icon-scan')).toBeTruthy();
    expect(queryByTestId('queue-meter')).toBeNull();
  });

  it("état submitting: titre et description spécifiques, pas de jauge", () => {
    const { getByText, queryByTestId } = render(<WaitingComponent status="submitting" />);
    expect(getByText(fr.waitingScreen.submitting_title)).toBeTruthy();
    expect(getByText(fr.waitingScreen.submitting_description)).toBeTruthy();
    expect(queryByTestId('queue-meter')).toBeNull();
  });

  it("état queued avec position > 1: affiche position interpolée et la jauge des slots", () => {
    const queueInfo = { position: 3, queued_total: 5, processing_total: 6, max_workers: 8 };
    const { getByText, getByTestId } = render(
      <WaitingComponent status="queued" queueInfo={queueInfo} />
    );
    expect(getByText(fr.waitingScreen.queued_title)).toBeTruthy();
    expect(getByText('Position 3 sur 5')).toBeTruthy();
    expect(getByText('6/8 agents occupés')).toBeTruthy();
    expect(getByTestId('queue-meter')).toBeTruthy();
    expect(getByTestId('icon-hourglass')).toBeTruthy();
  });

  it("état queued avec position = 1: affiche le message 'prochain'", () => {
    const queueInfo = { position: 1, queued_total: 1, processing_total: 8, max_workers: 8 };
    const { getByText } = render(<WaitingComponent status="queued" queueInfo={queueInfo} />);
    expect(getByText(fr.waitingScreen.queued_only_yours)).toBeTruthy();
  });

  it("état queued sans queueInfo: pas de jauge, retombe sur les libellés par défaut", () => {
    const { queryByTestId, getByText } = render(<WaitingComponent status="queued" />);
    expect(queryByTestId('queue-meter')).toBeNull();
    // Sans queueInfo on garde le titre par défaut "analyzing".
    expect(getByText(fr.waitingScreen.analyzing)).toBeTruthy();
  });

  it("état queued affiche autant de slots que max_workers et marque les occupés", () => {
    const queueInfo = { position: 2, queued_total: 2, processing_total: 3, max_workers: 8 };
    const { getAllByTestId } = render(<WaitingComponent status="queued" queueInfo={queueInfo} />);
    expect(getAllByTestId('queue-slot')).toHaveLength(8);
  });

  it('rend le testID waiting-component', () => {
    const { getByTestId } = render(<WaitingComponent />);
    expect(getByTestId('waiting-component')).toBeTruthy();
  });

  it("queueInfo sans position ni processing_total: tombe sur les défauts à 0", () => {
    const queueInfo = { max_workers: 8 }; // pas de position, pas de processing_total
    const { getByText, getAllByTestId } = render(
      <WaitingComponent status="queued" queueInfo={queueInfo} />
    );
    // position=0 → on tombe sur "queued_only_yours" (pos <= 1).
    expect(getByText(fr.waitingScreen.queued_only_yours)).toBeTruthy();
    // 8 slots, tous libres car processing_total tombe à 0.
    expect(getAllByTestId('queue-slot')).toHaveLength(8);
    // Le label "0/8 agents occupés" doit s'afficher.
    expect(getByText('0/8 agents occupés')).toBeTruthy();
  });

  it("queueInfo avec max_workers=0: pas de jauge affichée", () => {
    const queueInfo = { position: 1, queued_total: 1, processing_total: 0, max_workers: 0 };
    const { queryByTestId } = render(<WaitingComponent status="queued" queueInfo={queueInfo} />);
    expect(queryByTestId('queue-meter')).toBeNull();
  });

  it("queueInfo sans queued_total: la position sert de total dans le libellé", () => {
    // position=4, total absent → total = pos = 4.
    const queueInfo = { position: 4, processing_total: 8, max_workers: 8 };
    const { getByText } = render(<WaitingComponent status="queued" queueInfo={queueInfo} />);
    expect(getByText('Position 4 sur 4')).toBeTruthy();
  });
});
