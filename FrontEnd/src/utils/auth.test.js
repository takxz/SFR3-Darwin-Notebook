import * as authUtils from './auth';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store
jest.mock('expo-secure-store');

// Mock __DEV__ and process.env
const originalDev = global.__DEV__;

describe('auth utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_SKIP_AUTH;
    global.__DEV__ = false;
  });

  afterEach(() => {
    global.__DEV__ = originalDev;
  });

  describe('isAuthBypassEnabled()', () => {
    it('doit retourner false en production', () => {
      global.__DEV__ = false;
      process.env.EXPO_PUBLIC_SKIP_AUTH = 'true';

      const result = authUtils.isAuthBypassEnabled();

      expect(result).toBe(false);
    });

    it('doit retourner false en développement si EXPO_PUBLIC_SKIP_AUTH n\'est pas défini', () => {
      global.__DEV__ = true;
      delete process.env.EXPO_PUBLIC_SKIP_AUTH;

      const result = authUtils.isAuthBypassEnabled();

      expect(result).toBe(false);
    });

    it('doit retourner false en développement si EXPO_PUBLIC_SKIP_AUTH est "false"', () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_SKIP_AUTH = 'false';

      const result = authUtils.isAuthBypassEnabled();

      expect(result).toBe(false);
    });

    it('doit retourner true en développement si EXPO_PUBLIC_SKIP_AUTH est "true"', () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_SKIP_AUTH = 'true';

      const result = authUtils.isAuthBypassEnabled();

      expect(result).toBe(true);
    });

    it('doit retourner true seulement si BOTH __DEV__ et EXPO_PUBLIC_SKIP_AUTH sont vrais', () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_SKIP_AUTH = 'true';

      expect(authUtils.isAuthBypassEnabled()).toBe(true);

      global.__DEV__ = false;
      expect(authUtils.isAuthBypassEnabled()).toBe(false);

      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_SKIP_AUTH = 'false';
      expect(authUtils.isAuthBypassEnabled()).toBe(false);
    });
  });

  describe('saveToken()', () => {
    it('doit sauvegarder le token dans SecureStore', async () => {
      const token = 'valid-jwt-token-123';
      SecureStore.setItemAsync.mockResolvedValue(undefined);

      await authUtils.saveToken(token);

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', token);
    });

    it('doit utiliser la clé "userToken" pour stocker', async () => {
      const token = 'test-token';
      SecureStore.setItemAsync.mockResolvedValue(undefined);

      await authUtils.saveToken(token);

      const [key] = SecureStore.setItemAsync.mock.calls[0];
      expect(key).toBe('userToken');
    });

    it('ne doit pas appeler setItemAsync si le token est null', async () => {
      await authUtils.saveToken(null);

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('ne doit pas appeler setItemAsync si le token est undefined', async () => {
      await authUtils.saveToken(undefined);

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('ne doit pas appeler setItemAsync si le token est vide', async () => {
      await authUtils.saveToken('');

      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('doit pouvoir sauvegarder différents formats de tokens', async () => {
      const tokens = [
        'simple-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        'token-with-special-chars!@#$%^&*()',
        'very-long-token-' + 'x'.repeat(1000),
      ];

      for (const token of tokens) {
        SecureStore.setItemAsync.mockClear();
        await authUtils.saveToken(token);
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', token);
      }
    });

    it('doit gérer les erreurs de SecureStore', async () => {
      const token = 'test-token';
      const error = new Error('SecureStore error');
      SecureStore.setItemAsync.mockRejectedValue(error);

      await expect(authUtils.saveToken(token)).rejects.toThrow('SecureStore error');
    });
  });

  describe('getToken()', () => {
    it('doit retourner le debug bypass token si le bypass est activé', async () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_SKIP_AUTH = 'true';

      const token = await authUtils.getToken();

      expect(token).toBe('debug-bypass-token');
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });

    it('doit récupérer le token depuis SecureStore en mode normal', async () => {
      global.__DEV__ = false;
      const expectedToken = 'stored-token-from-secure-store';
      SecureStore.getItemAsync.mockResolvedValue(expectedToken);

      const token = await authUtils.getToken();

      expect(token).toBe(expectedToken);
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
    });

    it('doit retourner null si aucun token n\'est stocké', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null);

      const token = await authUtils.getToken();

      expect(token).toBeNull();
    });

    it('doit retourner le token stocké même si c\'est une string vide', async () => {
      SecureStore.getItemAsync.mockResolvedValue('');

      const token = await authUtils.getToken();

      expect(token).toBe('');
    });

    it('doit utiliser la clé "userToken" pour récupérer', async () => {
      SecureStore.getItemAsync.mockResolvedValue('token');

      await authUtils.getToken();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('userToken');
    });

    it('doit gérer les erreurs de SecureStore', async () => {
      const error = new Error('SecureStore retrieval error');
      SecureStore.getItemAsync.mockRejectedValue(error);

      await expect(authUtils.getToken()).rejects.toThrow('SecureStore retrieval error');
    });

    it('doit préférer le bypass token même si SecureStore contient un token', async () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_SKIP_AUTH = 'true';
      SecureStore.getItemAsync.mockResolvedValue('some-other-token');

      const token = await authUtils.getToken();

      expect(token).toBe('debug-bypass-token');
      expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    });
  });

  describe('clearToken()', () => {
    it('doit supprimer le token de SecureStore', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await authUtils.clearToken();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');
    });

    it('doit utiliser la clé "userToken" pour supprimer', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await authUtils.clearToken();

      const [key] = SecureStore.deleteItemAsync.mock.calls[0];
      expect(key).toBe('userToken');
    });

    it('doit gérer les erreurs de SecureStore', async () => {
      const error = new Error('Delete operation failed');
      SecureStore.deleteItemAsync.mockRejectedValue(error);

      await expect(authUtils.clearToken()).rejects.toThrow('Delete operation failed');
    });

    it('ne doit pas lever d\'erreur si le token n\'existe pas', async () => {
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      await expect(authUtils.clearToken()).resolves.not.toThrow();
    });
  });

  describe('Intégration - Cycle complet', () => {
    it('doit supporter le cycle: save -> get -> clear -> get', async () => {
      const token = 'integration-test-token';

      // Save
      SecureStore.setItemAsync.mockResolvedValue(undefined);
      await authUtils.saveToken(token);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('userToken', token);

      // Get
      SecureStore.getItemAsync.mockResolvedValue(token);
      let retrievedToken = await authUtils.getToken();
      expect(retrievedToken).toBe(token);

      // Clear
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);
      await authUtils.clearToken();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('userToken');

      // Get after clear
      SecureStore.getItemAsync.mockResolvedValue(null);
      retrievedToken = await authUtils.getToken();
      expect(retrievedToken).toBeNull();
    });

    it('doit gérer plusieurs save/get/clear cycles', async () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      SecureStore.setItemAsync.mockResolvedValue(undefined);
      SecureStore.getItemAsync.mockResolvedValue(token1);
      SecureStore.deleteItemAsync.mockResolvedValue(undefined);

      // First cycle
      await authUtils.saveToken(token1);
      let token = await authUtils.getToken();
      expect(token).toBe(token1);
      await authUtils.clearToken();

      // Second cycle with different token
      SecureStore.getItemAsync.mockResolvedValue(token2);
      await authUtils.saveToken(token2);
      token = await authUtils.getToken();
      expect(token).toBe(token2);
      await authUtils.clearToken();

      expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    });
  });
});
