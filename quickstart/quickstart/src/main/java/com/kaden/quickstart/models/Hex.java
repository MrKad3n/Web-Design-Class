import java.util.*;
import java.io.*;

public class Hex {
    
    private String action;
    private boolean cleared;
    private int level;
    private Mob[] mobs;
    private String type;
    //creates a hex with random monsters based of type.
    public Hex(String a, int l, String t){
        action=a;
        level=l;
        cleared=false;
        type=t;
        
        if (action.equals("start")){
            mobs= new Mob[2];
            mobs[0]=new Mob(type, l, 1);
            mobs[1]=new Mob(type, l, 2);
        }
        else if (action.equals("base")){
            mobs= new Mob[3];
            mobs[0]=new Mob(type, l, (int)(Math.random()*3)+1);
            mobs[1]=new Mob(type, l, (int)(Math.random()*3)+1);
            mobs[2]=new Mob(type, l, (int)(Math.random()*3)+1);
        }
        else if (action.equals("miniBoss")){
            mobs= new Mob[3];
            mobs[0]=new Mob(type, l, (int)(Math.random()*2)+2);
            mobs[1]=new Mob(type, l, (int)(Math.random()*2)+2);
            mobs[2]=new Mob(type, l, 4);
        }
        else if (action.equals("boss")){
            mobs= new Mob[3];
            mobs[0]=new Mob(type, l, 5);
        }
        
    }
    
    //accessor Methods
    
    public int getLevel(){
        return level;
    }
    
    public String getAction(){
        return action;
    }
    
    public boolean getCleared(){
        return cleared;
    }
    
    
    
    
    
    
    
}