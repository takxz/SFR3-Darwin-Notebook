import { render, screen } from '@testing-library/react-native';
import ButtonFightMode from './ButtonFightMode';
import { Sword } from 'lucide-react-native';

describe("Composant ButtonFightMode", () => {
    it("Doit afficher les données passées en props (titre, sous-titre,..)", () => {
        render(
            <ButtonFightMode
                title="TITRE DE TEST"
                subtitle="Sous-titre de test"
                extraText="MMR: 123"
                Icon={Sword}
                // Les props visuelles obligatoires pour éviter le crash
                gradientColors={["#ffffff", "#000000"]}
                themeColor="#ff0000"
                cornerColor="#00ff00"
            />
        );

        expect(screen.getByText("TITRE DE TEST")).toBeTruthy();
        expect(screen.getByText("Sous-titre de test")).toBeTruthy();
        expect(screen.getByText("MMR: 123")).toBeTruthy();
    });

    it("Ne doit pas crasher si la prop extraText n'est pas fournie", () => {
        render(
            <ButtonFightMode
                title="TEST 2"
                subtitle="test sans extraText"
                Icon={Sword}
                // Les props visuelles obligatoires pour éviter le crash
                gradientColors={["#ffffff", "#000000"]}
                themeColor="#ff0000"
                cornerColor="#00ff00"
            />
        );

        expect(screen.getByText("TEST 2")).toBeTruthy();
        expect(screen.getByText("test sans extraText")).toBeTruthy();
    });
});