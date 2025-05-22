@Controller
public class MainController {
    
    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("player", new Person("Player"));
        return "home";
    }
    
    @GetMapping("/battle")
    public String battle(Model model) {
        // Example battle setup
        Mob[] enemies = {new Mob("unknown", 1, 1)};
        model.addAttribute("enemies", enemies);
        return "battle";
    }
}