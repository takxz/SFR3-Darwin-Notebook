from app import app
import app.route  # noqa: F401  (enregistre les routes)

if __name__ == '__main__':
    app.run(debug=True, port=5001)