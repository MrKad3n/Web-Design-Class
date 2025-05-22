@Service
public class BattleService {
    
    @Autowired
    private ItemGenerator itemGenerator;
    
    public Item generateReward(int level) {
        Item reward = itemGenerator.generateRandomItem();
        return reward;
    }
    
    public void applyStatusEffects(Person target, int effectType) {
        // Implement burn/poison/etc logic
    }
}