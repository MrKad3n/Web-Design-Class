import java.util.*;
import java.io.*;
import java.util.Map;


public class Person{
    private String name;
    private Attack[] equippedAttack = new Attack[5];
    private ArrayList<Attack> attackInventory;
    private HashMap<String, Item> equiped;
    private static HashMap<String, Item> inventory = new HashMap<>();;
    
    private int maxLevel;
    private int maxHealth;
    
    private int level;
    private int strength;
    private int speed;
    private int magic;
    
    private int defense;
    private int health;
    private int exp;
    
    private HashMap<String, Integer> stats = new HashMap<String, Integer>();
    
    //constructors
    
    public Person (String n){
        
        name = n;
        level=1;
        equiped= new HashMap<String, Item>();
        inventory= new HashMap<String, Item>();
        this.updateStats();
        
    }
    //default person
    public Person (){
        
        name = "Bob";
        level=1;
        equiped= new HashMap<String, Item>();
        inventory= new HashMap<String, Item>();
        
    }
    
    //accessor methods
    
    public static HashMap<String, Item> getInventory() {
        return inventory;
    }
    
    public String getName(){
        return name;
    }
    
    public int getStrength(){
        return strength;
    }
    
    public int getSpeed(){
        return speed;
    }
    
    public int getLevel(){
        return level;
    }
    
    public int getMaxHealth(){
        return maxHealth;
    }
    
    public int getHealth(){
        return health;
    }
    
    public int getMagic(){
        return magic;
    }
    
    public int getDefense(){
        return defense;
    }
    
    //accesses an attack from the equipped attack list
    public Attack getEquippedAttack(int slot){
        return equippedAttack[slot];
    }
    
    
    public Attack getAttack(int slot){
        return attackInventory.get(slot);
    }
    
    
    // set methods
    
    public void newName(String n){
        name=n;
    }
    
    public void getExp(int e){
        while (e>=exp){
            level++;
            e-=exp;
            exp=level*level;
        }
        exp-=e;
    }
    
    
    
    public void setMax(int l){
        maxLevel=l;
    }
    
    public void getItem(String type, Item piece) {
        inventory.put(type, piece);
    }
    
    public void equip(Item piece){
        
        Item current = null;
        for (Map.Entry<String, Item> entry : equiped.entrySet()) {
            Item equippedItem = entry.getValue();
            if (equippedItem.getSlot().equals(piece.getSlot())) {
                current = equippedItem;
                break;
            }
        }
    
        if (current != null) {
            inventory.put(current.getName(), current);
            equiped.remove(current.getName());
        }
    
        equiped.put(piece.getName(), piece);
        inventory.remove(piece.getName());
        
       /* Item current = null;
        for (Map.Entry<String, Item> entry: equiped.entrySet()){
            current=entry.getValue();
            if (current.getSlot().equals(piece.getSlot())){
                break;
            }
            
        }
        inventory.put(current.getName(),current);
        equiped.put(piece.getName(),piece);
        inventory.remove(piece.getName());
        equiped.remove(current.getName());*/
        
    }
    
    //update methods
    
    public void updateStats(){
        
        int sum=0;
        
        //updates level based stats;
        
        strength=(int)(level*Math.sqrt(level));
        speed=(int)(Math.sqrt(level)+level);
        magic=(int)(level*Math.sqrt(level));
        health=(int)(level*Math.sqrt(level));
        
        //updates Strength
        for (Map.Entry<String, Item> entry: equiped.entrySet()){
            Item current = entry.getValue();
            sum+=current.getStrength();
        }
        stats.replace("strength",sum+strength);
        sum=0;
        
        //updates speed
        for (Map.Entry<String, Item> entry: equiped.entrySet()){
            Item current = entry.getValue();
            sum+=current.getSpeed();
        }
        stats.replace("speed",sum+speed);
        sum=0;
        
        //updates magic
        for (Map.Entry<String, Item> entry: equiped.entrySet()){
            Item current = entry.getValue();
            sum+=current.getMagic();
        }
        stats.replace("magic",sum+magic);
        sum=0;
        
        //updates health
        for (Map.Entry<String, Item> entry: equiped.entrySet()){
            Item current = entry.getValue();
            sum+=current.getHealth();
        }
        stats.replace("health",sum+health);
        sum=0;
        
        //updates defense
        for (Map.Entry<String, Item> entry: equiped.entrySet()){
            Item current = entry.getValue();
            sum+=current.getDefense();
        }
        stats.replace("defense",sum+defense);
        sum=0;
        
        
        
        
        
        
    }
    
    public void addAttack(Attack attack) {
        if (attackInventory == null) {
            attackInventory = new ArrayList<>();
        }
        attackInventory.add(attack);
    }

    public void equipAttack(int slot, Attack attack) {
        if (slot >= 0 && slot < equippedAttack.length) {
            equippedAttack[slot] = attack;
        }
    }
    
}