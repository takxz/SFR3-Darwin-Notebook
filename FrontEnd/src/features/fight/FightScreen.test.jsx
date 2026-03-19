import { render, screen } from '@testing-library/react-native';
import FightScreen from "./FightScreen";
import fr from "@/assets/locales/fr.json";

describe("Page FightScreen", () => {
    it("Doit afficher le header et les deux boutons de l'arène", () => {
        render(
            <FightScreen />
        );

        expect(screen.getByText(fr.fightScreen.header_title)).toBeTruthy();
        expect(screen.getByText(fr.fightScreen.header_subtitle)).toBeTruthy();

        expect(screen.getByText(fr.fightScreen.mode_duel)).toBeTruthy();
        expect(screen.getByText(fr.fightScreen.mode_career)).toBeTruthy();
    });
});