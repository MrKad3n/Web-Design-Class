import java.util.*;
import java.io.*;

public class Mob {
    
    private String name;
    
    
    
    private String type;
    private int level;
    
    private int strength;
    private int speed;
    
    private int health;
    private int maxHealth;
    private int healthBars;
    
    public Mob(String t, int l, int str, int sp, int h, int maxH, int hBars, String n){
        name=n;
        type=t;
        level=l;
        strength=str;
        speed=sp;
        health=h;
        maxHealth=maxH;
        healthBars=hBars;
    }
    public Mob(){
        name="none";
        type="none";
        level=0;
        strength=0;
        speed=0;
        health=0;
        maxHealth=0;
        healthBars=0;
    }
    //creates random mob based off type/tier
    public Mob(String t, int lvl, int tier){
        type=t;
        level=lvl;
        //Start of if chain
        if (tier==1){
           if (type.equals("undead")){
               name="Corspe";
               strength=(int)(5*Math.sqrt(lvl));
               speed=(int)(2*Math.sqrt(lvl));
               health=(int)(25*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("unknown")){
               name="Skull";
               strength=(int)(3.5*Math.sqrt(lvl));
               speed=(int)(3.5*Math.sqrt(lvl));
               health=(int)(15*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("flying")){
               name="Bats";
               strength=(int)(3*Math.sqrt(lvl));
               speed=(int)(3*Math.sqrt(lvl));
               health=(int)(3*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=4;
               
           }
           else if(type.equals("army")){
               name="Knight";
               strength=(int)(8*Math.sqrt(lvl));
               speed=(int)(2*Math.sqrt(lvl));
               health=(int)(35*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("ocean")){
               name="Pirana";
               strength=(int)(6*Math.sqrt(lvl));
               speed=(int)(4*Math.sqrt(lvl));
               health=(int)(10*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("creature")){
               name="Bunny";
               strength=0;
               speed=(int)(1*Math.sqrt(lvl));
               health=(int)(Math.sqrt(lvl));
               maxHealth=health;
               healthBars=2;
               
           }
            
        }
        else if (tier==2){
            
            if (type.equals("undead")){
               name="Crawler";
               strength=(int)(4*Math.sqrt(lvl));
               speed=(int)(2*Math.sqrt(lvl));
               health=(int)(15*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=2;
               
           }
           else if(type.equals("unknown")){
               name="Glob";
               strength=(int)(1.5*Math.sqrt(lvl));
               speed=(int)(2*Math.sqrt(lvl));
               health=(int)(45*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("flying")){
               name="Hawk";
               strength=(int)(5*Math.sqrt(lvl));
               speed=(int)(4.5*Math.sqrt(lvl));
               health=(int)(15*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("army")){
               name="Archer";
               strength=(int)(4.5*Math.sqrt(lvl));
               speed=(int)(4*Math.sqrt(lvl));
               health=(int)(20*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("ocean")){
               name="Coral Monster";
               strength=(int)(6*Math.sqrt(lvl));
               speed=(int)(4*Math.sqrt(lvl));
               health=(int)(25*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("creature")){
               name="Turtle Gang";
               strength=(int)(6*Math.sqrt(lvl));
               speed=(int)(1.5*Math.sqrt(lvl));
               health=(int)(12*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=3;
               
           }
            
            
        }
        else if (tier==3){
            
            if (type.equals("undead")){
               name="Frozen Corspe";
               strength=(int)(7*Math.sqrt(lvl));
               speed=(int)(3.5*Math.sqrt(lvl));
               health=(int)(35*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("unknown")){
               name="Alien";
               strength=(int)(8.5*Math.sqrt(lvl));
               speed=(int)(4*Math.sqrt(lvl));
               health=(int)(20*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("flying")){
               name="Harpy";
               strength=(int)(5*Math.sqrt(lvl));
               speed=(int)(7*Math.sqrt(lvl));
               health=(int)(30*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("army")){
               name="Mage";
               strength=(int)(6.5*Math.sqrt(lvl));
               speed=(int)(5*Math.sqrt(lvl));
               health=(int)(20*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("ocean")){
               name="Stingray";
               strength=(int)(7.5*Math.sqrt(lvl));
               speed=(int)(5.5*Math.sqrt(lvl));
               health=(int)(20*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("creature")){
               name="Bear";
               strength=(int)(10*Math.sqrt(lvl));
               speed=(int)(3*Math.sqrt(lvl));
               health=(int)(40*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
            
            
            
        }
        else if (tier==4){
            
            if (type.equals("undead")){
               name="Necromancer";
               strength=(int)(8*Math.sqrt(lvl));
               speed=(int)(6*Math.sqrt(lvl));
               health=(int)(80*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("unknown")){
               name="Cursed Knight";
               strength=(int)(15*Math.sqrt(lvl));
               speed=(int)(6.5*Math.sqrt(lvl));
               health=(int)(65*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("flying")){
               name="Valkerie";
               strength=(int)(10*Math.sqrt(lvl));
               speed=(int)(10*Math.sqrt(lvl));
               health=(int)(50*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("army")){
               name="Kings Guard";
               strength=(int)(12*Math.sqrt(lvl));
               speed=(int)(6.5*Math.sqrt(lvl));
               health=(int)(60*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("ocean")){
               name="Shark";
               strength=(int)(12*Math.sqrt(lvl));
               speed=(int)(8*Math.sqrt(lvl));
               health=(int)(45*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("creature")){
               name="Polar Bear";
               strength=(int)(15*Math.sqrt(lvl));
               speed=(int)(5*Math.sqrt(lvl));
               health=(int)(70*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
            
        }
        else {
            
            if (type.equals("undead")){
               name="Mutant";
               strength=(int)(18*Math.sqrt(lvl));
               speed=(int)(12*Math.sqrt(lvl));
               health=(int)(100*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("unknown")){
               name="Shadow";
               strength=(int)(7*Math.sqrt(lvl));
               speed=(int)(20*Math.sqrt(lvl));
               health=(int)(110*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("flying")){
               name="Avian";
               strength=(int)(13*Math.sqrt(lvl));
               speed=(int)(14*Math.sqrt(lvl));
               health=(int)(110*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("army")){
               name="Kings Guard";
               strength=(int)(11*Math.sqrt(lvl));
               speed=(int)(9*Math.sqrt(lvl));
               health=(int)(120*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
           else if(type.equals("ocean")){
               name="Kraken";
               strength=(int)(23*Math.sqrt(lvl));
               speed=(int)(6*Math.sqrt(lvl));
               health=(int)(45*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=3;
               
           }
           else if(type.equals("creature")){
               name="Dragon";
               strength=(int)(20*Math.sqrt(lvl));
               speed=(int)(10*Math.sqrt(lvl));
               health=(int)(160*Math.sqrt(lvl));
               maxHealth=health;
               healthBars=1;
               
           }
            
        }
        //End of if chain
        
        
        
        
        
    }
    
    //Accessor Methods
    
    public String getType(){
        return type;
    }
    
    public int getLevel(){
        return level;
    }
    
    public int getStrength(){
        return strength;
    }
    
    public int getSpeed(){
        return speed;
    }
    
    public int getHealth(){
        return health;
    }
    
    public int getMaxHealth(){
        return maxHealth;
    }
    
    public int getHealthBars(){
        return healthBars;
    }
    
    //update Methods
    
    public void setHealth(int health) {
        this.health = Math.min(health, maxHealth);
    }

    public void setMaxHealth(int maxHealth) {
        this.maxHealth = maxHealth;
    }
    
}