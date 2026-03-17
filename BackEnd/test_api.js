const url = 'http://localhost:3000/api/auth/register';

const testUser = {
    email: "test.darwin@example.com",
    pseudo: "DarwinUser123",
    password: "Password123!"
};

async function runTest() {
    console.log(`🚀 Tentative d'inscription sur ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Inscription réussie ! Voici la réponse du serveur :");
            console.log(data);
        } else {
            console.log("❌ L'inscription a échoué avec le statut :", response.status);
            console.log("Message d'erreur :", data);
        }
    } catch (error) {
        console.error("❌ Erreur impossible de contacter le serveur :", error.message);
    }
}

runTest();
