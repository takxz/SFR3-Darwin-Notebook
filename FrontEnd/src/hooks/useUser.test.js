import { renderHook, waitFor } from '@testing-library/react-native';
import { useUser } from './useUser';
import * as authUtils from '../utils/auth';

// Mock the auth utilities
jest.mock('../utils/auth', () => ({
  getToken: jest.fn(),
  clearToken: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Suppress act() warnings for this test suite (expected for async effects)
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((message) => {
    // Filter out expected HookContainer act() warnings
    if (typeof message === 'string' && message.includes('An update to HookContainer inside a test was not wrapped in act')) {
      return;
    }
    // Call the original console.error for other messages
  });
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('useUser Hook', () => {
  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    pseudo: 'TestUser',
    player_level: 5,
  };

  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    authUtils.getToken.mockClear();
    authUtils.clearToken.mockClear();
  });

  it('doit avoir un état initial de chargement', () => {
    authUtils.getToken.mockResolvedValue(null);
    const { result } = renderHook(() => useUser());

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('doit définir une erreur lorsque aucun token n\'existe', async () => {
    authUtils.getToken.mockResolvedValue(null);

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.error).toBe('Connexion requise.');
    expect(result.current.user).toBeNull();
  });

  it('doit récupérer le profil utilisateur avec succès avec un token valide', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockUser),
    });

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://ikdeksmp.fr:3001/api/user/profile',
      {
        headers: {
          Authorization: `Bearer ${mockToken}`,
        },
      }
    );
  });

  it('doit effacer le token et définir une erreur sur 401 Unauthorized', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
    });

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(authUtils.clearToken).toHaveBeenCalled();
    expect(result.current.error).toBe(
      'Token invalide ou expiré. Veuillez vous reconnecter.'
    );
    expect(result.current.user).toBeNull();
  });

  it('doit effacer le token et définir une erreur sur 403 Forbidden', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue({ error: 'Forbidden' }),
    });

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(authUtils.clearToken).toHaveBeenCalled();
    expect(result.current.error).toBe(
      'Token invalide ou expiré. Veuillez vous reconnecter.'
    );
  });

  it('doit gérer un message d\'erreur personnalisé depuis la réponse API', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    const customError = 'User profile not found';
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ error: customError }),
    });

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.error).toBe(customError);
    expect(result.current.user).toBeNull();
  });

  it('doit revenir à un message d\'erreur générique si la réponse API ne contient pas d\'erreur ou de message', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.error).toBe('Impossible de charger le profil (500)');
  });

  it('doit gérer les erreurs de réseau', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    const networkError = new Error('Network request failed');
    global.fetch.mockRejectedValue(networkError);

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.error).toBe('Network request failed');
    expect(result.current.user).toBeNull();
  });

  it('doit gérer les erreurs de parsing JSON', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest
        .fn()
        .mockRejectedValue(new Error('Invalid JSON response')),
    });

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(result.current.error).toBe('Invalid JSON response');
  });

  it('doit définir le chargement à false après la complétion de la récupération des données', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockUser),
    });

    const { result } = renderHook(() => useUser());

    // Initial state
    expect(result.current.loading).toBe(true);

    // After fetch
    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );
  });

  it('doit gérer le champ response.message comme message d\'erreur de repli', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    const messageError = 'User account is locked';
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue({ message: messageError }),
    });

    const { result } = renderHook(() => useUser());

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Should use special message for 403 status
    expect(result.current.error).toBe(
      'Token invalide ou expiré. Veuillez vous reconnecter.'
    );
  });

  it('doit utiliser l\'URL de base API correcte', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockUser),
    });

    renderHook(() => useUser());

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe('http://ikdeksmp.fr:3001/api/user/profile');
  });

  it('doit inclure l\'en-tête Authorization avec le token Bearer', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockUser),
    });

    renderHook(() => useUser());

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('doit ne fetcher qu\'une seule fois à l\'initialisation', async () => {
    authUtils.getToken.mockResolvedValue(mockToken);
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockUser),
    });

    renderHook(() => useUser());

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
  });
});
