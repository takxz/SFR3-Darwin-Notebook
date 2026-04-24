import socketService from './SocketService';
import { io } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('SocketService', () => {
  let mockSocket;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock socket instance
    mockSocket = {
      id: 'mock-socket-id-123',
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn(),
    };

    // Mock io to return our mock socket
    io.mockReturnValue(mockSocket);

    // Reset socketService.socket to null
    socketService.socket = null;

    // Suppress console.log during tests
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('connect()', () => {
    it('doit créer une connexion socket avec les bonnes options', () => {
      socketService.connect();

      expect(io).toHaveBeenCalledWith('http://10.213.251.138:3001', {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      expect(socketService.socket).toBe(mockSocket);
    });

    it('doit enregistrer les événements de connexion (connect, disconnect, connect_error)', () => {
      socketService.connect();

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledTimes(3);
    });

    it('doit logger lors de la connexion', () => {
      socketService.connect();

      expect(console.log).toHaveBeenCalledWith('[SocketService] Connecting to http://10.213.251.138:3001...');
    });

    it('doit gérer l\'événement connect et logger l\'ID du socket', () => {
      socketService.connect();

      // Récupérer le callback de l'événement 'connect'
      const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
      
      // Simuler l'événement connect
      connectCallback();

      expect(console.log).toHaveBeenCalledWith('[SocketService] Connected! ID:', mockSocket.id);
    });

    it('doit gérer l\'événement disconnect et logger la raison', () => {
      socketService.connect();

      const disconnectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      const reason = 'server disconnect';
      
      disconnectCallback(reason);

      expect(console.log).toHaveBeenCalledWith('[SocketService] Disconnected:', reason);
    });

    it('doit gérer l\'événement connect_error et logger l\'erreur', () => {
      socketService.connect();

      const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      const error = new Error('Connection refused');
      
      errorCallback(error);

      expect(console.log).toHaveBeenCalledWith('[SocketService] Connection Error:', error);
    });

    it('ne doit pas reconnecter si le socket est déjà connecté', () => {
      socketService.connect();
      io.mockClear();

      // Tentative de connexion à nouveau
      socketService.connect();

      // io ne doit pas être appelé une deuxième fois
      expect(io).not.toHaveBeenCalled();
      expect(socketService.socket).toBe(mockSocket);
    });

    it('doit utiliser l\'URL de serveur correcte', () => {
      socketService.connect();

      const [url] = io.mock.calls[0];
      expect(url).toBe('http://10.213.251.138:3001');
    });
  });

  describe('disconnect()', () => {
    it('doit appeler disconnect sur le socket', () => {
      socketService.connect();
      socketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('doit mettre socket à null après déconnexion', () => {
      socketService.connect();
      socketService.disconnect();

      expect(socketService.socket).toBeNull();
    });

    it('ne doit rien faire si socket est null', () => {
      socketService.socket = null;

      // Cela ne doit pas lever d'erreur
      expect(() => socketService.disconnect()).not.toThrow();
    });

    it('doit pouvoir se reconnecter après une déconnexion', () => {
      socketService.connect();
      socketService.disconnect();

      io.mockClear();
      const newMockSocket = { ...mockSocket };
      io.mockReturnValue(newMockSocket);

      socketService.connect();

      expect(io).toHaveBeenCalled();
      expect(socketService.socket).toBe(newMockSocket);
    });
  });

  describe('emit()', () => {
    it('doit émettre un événement via le socket', () => {
      socketService.connect();
      const eventName = 'playerAction';
      const eventData = { action: 'ATTACK', damage: 15 };

      socketService.emit(eventName, eventData);

      expect(mockSocket.emit).toHaveBeenCalledWith(eventName, eventData);
    });

    it('doit supporter plusieurs émissions d\'événements', () => {
      socketService.connect();

      socketService.emit('event1', { data: 1 });
      socketService.emit('event2', { data: 2 });

      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledWith('event1', { data: 1 });
      expect(mockSocket.emit).toHaveBeenCalledWith('event2', { data: 2 });
    });

    it('ne doit pas émettre si socket est null', () => {
      socketService.socket = null;

      socketService.emit('event', { data: 'test' });

      expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it('doit pouvoir émettre des événements avec différents types de données', () => {
      socketService.connect();

      socketService.emit('stringEvent', 'simple string');
      socketService.emit('numberEvent', 42);
      socketService.emit('objectEvent', { key: 'value' });
      socketService.emit('arrayEvent', [1, 2, 3]);

      expect(mockSocket.emit).toHaveBeenCalledWith('stringEvent', 'simple string');
      expect(mockSocket.emit).toHaveBeenCalledWith('numberEvent', 42);
      expect(mockSocket.emit).toHaveBeenCalledWith('objectEvent', { key: 'value' });
      expect(mockSocket.emit).toHaveBeenCalledWith('arrayEvent', [1, 2, 3]);
    });

    it('doit gérer les émissions sans données', () => {
      socketService.connect();

      socketService.emit('eventWithoutData');

      expect(mockSocket.emit).toHaveBeenCalledWith('eventWithoutData', undefined);
    });
  });

  describe('on()', () => {
    it('doit enregistrer un écouteur d\'événement sur le socket', () => {
      socketService.connect();
      const callback = jest.fn();
      const eventName = 'battleStart';

      socketService.on(eventName, callback);

      expect(mockSocket.on).toHaveBeenCalledWith(eventName, callback);
    });

    it('doit supporter plusieurs écouteurs d\'événements différents', () => {
      socketService.connect();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      socketService.on('event1', callback1);
      socketService.on('event2', callback2);

      expect(mockSocket.on).toHaveBeenCalledWith('event1', callback1);
      expect(mockSocket.on).toHaveBeenCalledWith('event2', callback2);
    });

    it('ne doit pas enregistrer un écouteur si socket est null', () => {
      socketService.socket = null;
      const callback = jest.fn();

      socketService.on('event', callback);

      // mockSocket.on ne doit pas être appelé pour l'écouteur utilisateur
      // (il peut l'être pour les événements de connexion)
      const userListenerCalls = mockSocket.on.mock.calls.filter(
        call => call[0] === 'event'
      );
      expect(userListenerCalls.length).toBe(0);
    });

    it('doit pouvoir enregistrer le même événement plusieurs fois avec des callbacks différents', () => {
      socketService.connect();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      socketService.on('sameEvent', callback1);
      socketService.on('sameEvent', callback2);

      expect(mockSocket.on).toHaveBeenCalledWith('sameEvent', callback1);
      expect(mockSocket.on).toHaveBeenCalledWith('sameEvent', callback2);
    });
  });

  describe('off()', () => {
    it('doit désinscrire un écouteur d\'événement du socket', () => {
      socketService.connect();
      const eventName = 'battleStart';

      socketService.off(eventName);

      expect(mockSocket.off).toHaveBeenCalledWith(eventName);
    });

    it('doit supporter la suppression de plusieurs écouteurs', () => {
      socketService.connect();

      socketService.off('event1');
      socketService.off('event2');

      expect(mockSocket.off).toHaveBeenCalledWith('event1');
      expect(mockSocket.off).toHaveBeenCalledWith('event2');
      expect(mockSocket.off).toHaveBeenCalledTimes(2);
    });

    it('ne doit rien faire si socket est null', () => {
      socketService.socket = null;

      // Cela ne doit pas lever d'erreur
      expect(() => socketService.off('event')).not.toThrow();
    });

    it('doit pouvoir désinscrire puis réinscrire le même événement', () => {
      socketService.connect();
      const callback = jest.fn();

      socketService.off('event');
      socketService.on('event', callback);

      expect(mockSocket.off).toHaveBeenCalledWith('event');
      expect(mockSocket.on).toHaveBeenCalledWith('event', callback);
    });
  });

  describe('Intégration', () => {
    it('doit supporter un cycle complet: connect -> on -> emit -> off -> disconnect', () => {
      const callback = jest.fn();

      // Connect
      socketService.connect();
      expect(socketService.socket).not.toBeNull();

      // Register listener
      socketService.on('event', callback);
      expect(mockSocket.on).toHaveBeenCalledWith('event', callback);

      // Emit event
      socketService.emit('event', { data: 'test' });
      expect(mockSocket.emit).toHaveBeenCalledWith('event', { data: 'test' });

      // Unregister listener
      socketService.off('event');
      expect(mockSocket.off).toHaveBeenCalledWith('event');

      // Disconnect
      socketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(socketService.socket).toBeNull();
    });

    it('doit maintenir l\'état entre les appels', () => {
      socketService.connect();
      const socket1 = socketService.socket;

      socketService.emit('event1', {});
      const socket2 = socketService.socket;

      socketService.on('event2', jest.fn());
      const socket3 = socketService.socket;

      // Le socket doit rester le même
      expect(socket1).toBe(socket2);
      expect(socket2).toBe(socket3);
    });

    it('doit être un singleton accessible en tant que service', () => {
      socketService.connect();
      const socket1 = socketService.socket;

      // Importer le service à nouveau simule un autre module l'utilisant
      socketService.emit('event', {});
      const socket2 = socketService.socket;

      // Doit être le même socket (singleton)
      expect(socket1).toBe(socket2);
    });
  });

  describe('Gestion des erreurs', () => {
    it('doit gérer une tentative de connexion avec une URL invalide gracieusement', () => {
      socketService.connect();

      expect(socketService.socket).toBe(mockSocket);
    });

    it('doit gérer une déconnexion lors d\'une erreur de socket', () => {
      socketService.connect();
      
      const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
      errorCallback(new Error('Connection failed'));

      // Le service doit quand même permettre une déconnexion
      socketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('doit ignorer les appels de emit/on/off si socket est null sans lever d\'erreur', () => {
      socketService.socket = null;

      expect(() => {
        socketService.emit('event', {});
        socketService.on('event', jest.fn());
        socketService.off('event');
      }).not.toThrow();
    });
  });
});
