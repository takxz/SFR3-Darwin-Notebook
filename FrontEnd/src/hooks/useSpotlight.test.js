import { renderHook, act } from '@testing-library/react-native';
import { useSpotlight } from './useSpotlight';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
}));

const SecureStore = require('expo-secure-store');

describe('useSpotlight', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("ne s'affiche pas si userId est absent", async () => {
        const { result } = renderHook(() => useSpotlight('map_button', null));
        expect(result.current.visible).toBe(false);
    });

    it("s'affiche si le tooltip n'a jamais été vu", async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(null);

        const { result } = renderHook(() => useSpotlight('map_button', '42'));

        await act(async () => {});

        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('spotlight_map_button_42');
        expect(result.current.visible).toBe(true);
    });

    it("ne s'affiche pas si le tooltip a déjà été vu", async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce('true');

        const { result } = renderHook(() => useSpotlight('map_button', '42'));

        await act(async () => {});

        expect(result.current.visible).toBe(false);
    });

    it("dismiss masque le tooltip et sauvegarde dans SecureStore", async () => {
        SecureStore.getItemAsync.mockResolvedValueOnce(null);
        SecureStore.setItemAsync.mockResolvedValueOnce(undefined);

        const { result } = renderHook(() => useSpotlight('map_button', '42'));

        await act(async () => {});
        expect(result.current.visible).toBe(true);

        await act(async () => {
            await result.current.dismiss();
        });

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('spotlight_map_button_42', 'true');
        expect(result.current.visible).toBe(false);
    });

    it("utilise une clé unique par userId et par key", async () => {
        SecureStore.getItemAsync.mockResolvedValue(null);

        renderHook(() => useSpotlight('capture_button', '99'));

        await act(async () => {});

        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('spotlight_capture_button_99');
    });
});
