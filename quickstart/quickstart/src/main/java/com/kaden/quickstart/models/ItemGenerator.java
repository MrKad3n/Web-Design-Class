import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class ItemGenerator {
    private static class WeightedItem {
        String name;
        String slot;
        String rarity;
        int weight;
        
        public WeightedItem(String name, String slot, String rarity, int weight) {
            this.name = name;
            this.slot = slot;
            this.rarity = rarity;
            this.weight = weight;
        }
    }

    private final List<WeightedItem> weightedItems;
    private final int totalWeight;
    private final Random random;

    public ItemGenerator() {
        this.weightedItems = new ArrayList<>();
        this.random = new Random();
        
        // Add all items with non-zero weights (using the weights from your first table)
        addWeightedItem("Stick", "Weapon", "Base", 1);
        addWeightedItem("Coral Dagger", "Weapon", "Uncommon", 35);
        addWeightedItem("Spell Shield", "Offhand", "Uncommon", 35);
        addWeightedItem("Sea Crystal", "Offhand", "Uncommon", 35);
        addWeightedItem("Shell", "Offhand", "Uncommon", 45);
        addWeightedItem("Iron helmet", "Helmet", "Uncommon", 40);
        addWeightedItem("Iron Chestplate", "Chest", "Uncommon", 40);
        addWeightedItem("Iron Legging", "Leg", "Uncommon", 40);
        addWeightedItem("Iron Boots", "Boot", "Uncommon", 40);
        addWeightedItem("Spiked Shield", "Weapon", "Rare", 15);
        addWeightedItem("Grimore", "Weapon", "Rare", 20);
        addWeightedItem("Forest Crown", "Helmet", "Rare", 15);
        addWeightedItem("Frosted helmet", "helmet", "Rare", 25);
        addWeightedItem("Frosted Chest", "chest", "Rare", 25);
        addWeightedItem("Frosted Leg", "leg", "Rare", 25);
        addWeightedItem("Frosted Boots", "boot", "Rare", 25);
        addWeightedItem("Ice Spear", "Weapon", "Rare", 20);
        addWeightedItem("Shadow Staff", "Weapon", "Epic", 8);
        addWeightedItem("Blaze Blade", "Weapon", "Epic", 8);
        addWeightedItem("Gem Helmet", "helmet", "Epic", 6);
        addWeightedItem("Gem Chest", "chest", "Epic", 6);
        addWeightedItem("Gem Legs", "leg", "Epic", 6);
        addWeightedItem("Gem Boots", "Boots", "Epic", 6);
        addWeightedItem("Water Skaters", "Boots", "Epic", 8);
        addWeightedItem("Light Saber", "Weapon", "Legendary", 2);
        addWeightedItem("Demon Sythe", "Weapon", "Legendary", 3);
        addWeightedItem("Lightning Spear", "Offhand", "Legendary", 3);
        addWeightedItem("Pixel Sword", "Weapon", "Legendary", 3);
        addWeightedItem("Ice Cream Gun", "Weapon", "Legendary", 3);
        addWeightedItem("Running Spikes", "Boots", "Mythical", 1);
        addWeightedItem("Spell Blade", "Weapon", "Mythical", 1);

        this.totalWeight = weightedItems.stream().mapToInt(item -> item.weight).sum();
    }

    private void addWeightedItem(String name, String slot, String rarity, int weight) {
        if (weight > 0) {
            weightedItems.add(new WeightedItem(name, slot, rarity, weight));
        }
    }
    
    //Item Generator
    
    public Item generateRandomItem() {
        int randomValue = random.nextInt(totalWeight) + 1;
        int cumulativeWeight = 0;

        for (WeightedItem weightedItem : weightedItems) {
            cumulativeWeight += weightedItem.weight;
            if (randomValue <= cumulativeWeight) {
                return createItemFromName(weightedItem.name);
            }
        }

        return new Item(); // fallback to default stick
    }
    
    
    
    //item stats
    private Item createItemFromName(String name) {
        // Implement all items from your second table
        switch (name) {
            case "Wooden Sword":
                return new Item(3, 1, 0, 0, 0, 1, "stap", "Wooden Sword", "Weapon");
            case "Stick":
                return new Item(1, 1, 0, 0, 1, 0, "slap", "Stick", "Weapon");
            case "Grass Staff":
                return new Item(0, 1, 2, 0, 3, 1, "leaf impale", "Grass Staff", "Weapon");
            case "Coral Dagger":
                return new Item(4, 2, 0, 0, 2, 2, "coral leech", "Coral Dagger", "Weapon");
            case "Spell Shield":
                return new Item(0, -1, 10, 5, 2, 3, "reflection", "Spell Shield", "Offhand");
            case "Sea Crystal":
                return new Item(0, 1, 0, 5, 4, 2, "sea shield", "Sea Crystal", "Offhand");
            case "Shell":
                return new Item(3, -1, 15, 5, -1, 0, "none", "Shell", "Offhand");
            case "Iron helmet":
                return new Item(0, 0, 5, 3, 0, 0, "none", "Iron helmet", "Helmet");
            case "Iron Chestplate":
                return new Item(1, 0, 10, 6, 0, 0, "none", "Iron Chestplate", "Chest");
            case "Iron Legging":
                return new Item(0, 1, 7, 2, 0, 0, "none", "Iron Legging", "Leg");
            case "Iron Boots":
                return new Item(0, 1, 3, 1, 0, 0, "none", "Iron Boots", "Boot");
            case "Spiked Shield":
                return new Item(7, 0, 15, 10, 0, 4, "Charge", "Spiked Shield", "Weapon");
            case "Grimore":
                return new Item(-2, 2, -2, -2, 12, 5, "Plasma Blast", "Grimore", "Weapon");
            case "Forest Crown":
                return new Item(0, 3, 5, 15, 5, 6, "Tree People", "Forest Crown", "Helmet");
            case "Frosted helmet":
                return new Item(0, -1, 5, 8, 2, 0, "none", "Frosted helmet", "helmet");
            case "Frosted Chest":
                return new Item(0, -2, 20, 14, 2, 0, "none", "Frosted Chest", "chest");
            case "Frosted Leg":
                return new Item(0, 0, 10, 6, 1, 0, "none", "Frosted Leg", "leg");
            case "Frosted Boots":
                return new Item(0, 3, 3, 3, 1, 0, "none", "Frosted Boots", "boot");
            case "Ice Spear":
                return new Item(10, 2, 0, 0, 1, 1, "plunge", "Ice Spear", "Weapon");
            case "Shadow Staff":
                return new Item(2, 1, 0, -5, 22, 7, "shadow vortex", "Shadow Staff", "Weapon");
            case "Blaze Blade":
                return new Item(16, 5, 3, 0, 7, 8, "Incenerate", "Blaze Blade", "Weapon");
            case "Gem Helmet":
                return new Item(3, 0, 12, 13, 4, 3, "none", "Gem Helmet", "helmet");
            case "Gem Chest":
                return new Item(4, -1, 26, 17, 5, 0, "none", "Gem Chest", "chest");
            case "Gem Legs":
                return new Item(3, 2, 15, 12, 4, 0, "none", "Gem Legs", "leg");
            case "Gem Boots":
                return new Item(2, 3, 25, 10, 3, 3, "none", "Gem Boots", "Boots");
            case "Water Skaters":
                return new Item(0, -1, 15, 8, 11, 9, "skater slice", "Water Skaters", "Boots");
            case "Light Saber":
                return new Item(30, 14, -5, 5, 20, 10, "force strike", "Light Saber", "Weapon");
            case "Demon Sythe":
                return new Item(50, 14, 0, 10, -10, 11, "Grim slice", "Demon Sythe", "Weapon");
            case "Lightning Spear":
                return new Item(3, -3, 0, 0, 35, 12, "Thunder", "Lightning Spear", "Offhand");
            case "Pixel Sword":
                return new Item(40, 12, 10, 0, 15, 13, "Combo", "Pixel Sword", "Weapon");
            case "Ice Cream Gun":
                return new Item(0, -2, 10, 15, 5, 14, "Chilled Cream", "Ice Cream Gun", "Weapon");
            case "Running Spikes":
                return new Item(5, 32, 0, 25, -10, 15, "none", "Running Spikes", "Boots");
            case "Rulers Hand":
                return new Item(65, 10, 25, -40, 65, 16, "Arise", "Rulers Hand", "Weapon");
            case "Muramasa":
                return new Item(110, 20, 0, 10, 0, 17, "Pure skill", "Muramasa", "Weapon");
            case "Spell Blade":
                return new Item(50, 15, 15, 20, 90, 18, "spell infused", "Spell Blade", "Weapon");
            case "Enahnced Stick":
                return new Item(20, 22, 25, 25, 60, 19, "enhance", "Enahnced Stick", "Weapon");
            case "Divine Crown":
                return new Item(0, -10, 40, 90, 100, 20, "Rulers Authority", "Divine Crown", "Helmet");
            default:
                return new Item(); // default stick
        }
    }
    
    //accessor methods
    
    // needs to be changed in future O(N) - dont mess with
    public double getPercent(String nam){
        for (WeightedItem weightedItem : weightedItems) {
            if (weightedItem.name.equals(nam)){
                return (weightedItem.weight/(double)totalWeight);
            }
        }
        return 0.0;
    }
    
    
    
}