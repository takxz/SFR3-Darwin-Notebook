from app import app
import app.route  # noqa: F401  (enregistre les routes)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
