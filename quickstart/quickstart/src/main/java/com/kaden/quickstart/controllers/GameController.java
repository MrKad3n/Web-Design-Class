import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@SessionAttributes({"party", "currentMap", "currentHexIndex"})
public class GameController {
    private Battle currentBattle;
    private Person[] party;
    private Map currentMap;
    private int currentHexIndex = 0;

    @GetMapping("/")
    public String home(Model model) {
        // Initialize game if needed
        if (party == null) {
            initializeGame();
        }
        model.addAttribute("player", party[0]);
        return "home";
    }

    @GetMapping("/map")
    public String showMap(Model model) {
        if (currentMap == null) {
            currentMap = new Map(party[0].getLevel(), "array");
        }
        model.addAttribute("currentHex", currentMap.getHex(currentHexIndex));
        return "map";
    }

    @GetMapping("/battle")
    public String startBattle(Model model) {
        Hex currentHex = currentMap.getHex(currentHexIndex);
        Mob[] enemies = currentHex.getMobs();
        currentBattle = new Battle(party, enemies);
        
        model.addAttribute("battle", currentBattle);
        model.addAttribute("player", currentBattle.getCurrentCharacter());
        model.addAttribute("enemies", currentBattle.getEnemies());
        return "battle";
    }

    @PostMapping("/battle/attack")
    public String processAttack(@RequestParam int attackSlot, 
                               @RequestParam int targetIndex,
                               Model model) {
        String battleLog = currentBattle.processTurn(attackSlot, targetIndex);
        
        model.addAttribute("battleLog", battleLog);
        model.addAttribute("battle", currentBattle);
        model.addAttribute("player", currentBattle.getCurrentCharacter());
        model.addAttribute("enemies", currentBattle.getEnemies());
        
        if (currentBattle.isBattleOver()) {
            if (currentBattle.isVictory()) {
                // Generate reward and move to next hex
                currentHexIndex++;
                if (currentHexIndex >= currentMap.getPath().length) {
                    // Map completed
                    return "redirect:/victory";
                }
                return "redirect:/map";
            } else {
                return "redirect:/defeat";
            }
        }
        
        return "battle";
    }

    @GetMapping("/inventory")
    public String showInventory(Model model) {
        model.addAttribute("party", party);
        model.addAttribute("inventory", Person.getInventory());
        return "inventory";
    }

    @PostMapping("/inventory/equip")
    public String equipItem(@RequestParam String itemName, Model model) {
        Item item = Person.getInventory().get(itemName);
        if (item != null) {
            party[0].equip(item);
        }
        return "redirect:/inventory";
    }

    private void initializeGame() {
        party = new Person[5];
        party[0] = new Person("Player");
        // Initialize with basic equipment
        Item starterWeapon = new Item(3, 1, 0, 0, 0, 1, "stap", "Wooden Sword", "Weapon");
        party[0].getItem("Weapon", starterWeapon);
        party[0].equip(starterWeapon);
        
        // Add some party members
        for (int i = 1; i < 5; i++) {
            party[i] = new Person("Companion " + i);
        }
    }

    @PostMapping("/save")
    public String saveGame(HttpSession session) {
        GameState state = new GameState(party, currentMap, currentHexIndex);
        session.setAttribute("gameState", state);
        return "redirect:/";
    }

    @GetMapping("/load")
    public String loadGame(HttpSession session) {
        GameState state = (GameState) session.getAttribute("gameState");
        if (state != null) {
            this.party = state.getParty();
            // Restore other state
        }
        return "redirect:/map";
    }
}