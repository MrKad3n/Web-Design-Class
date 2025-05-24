import java.util.*;

public class Battle {
    private Person[] party;
    private Person current;
    private Mob[] enemies;
    private int alive;
    private int remaining;
    private int currentTurn = 0;
    private boolean playerTurn = true;
    private Random random = new Random();

    public Battle(Person[] p, Mob[] e) {
        party = p;
        enemies = e;
        current = party[0];
        alive = party.length;
        remaining = enemies.length;
    }

    public void alive() {
        int count = 0;
        for (Person person : party) {
            if (person.getHealth() > 0) {
                count++;
            }
        }
        alive = count;
    }

    public void remaining() {
        int count = 0;
        for (Mob mob : enemies) {
            if (mob.getHealth() > 0) {
                count++;
            }
        }
        remaining = count;
    }

    // Battle turn logic
    public String processTurn(int attackSlot, int targetIndex) {
        StringBuilder battleLog = new StringBuilder();
        
        // Player's turn
        if (playerTurn) {
            Attack attack = current.getEquippedAttack(attackSlot);
            Mob target = enemies[targetIndex];
            
            if (attack != null && target.getHealth() > 0) {
                // Calculate damage
                int damage = calculateDamage(attack, current, target);
                target.setHealth(target.getHealth() - damage);
                
                battleLog.append(String.format("%s used %s on %s for %d damage!\n", 
                    current.getName(), attack.getName(), target.getName(), damage));
                
                // Check if enemy defeated
                if (target.getHealth() <= 0) {
                    target.setHealth(0);
                    remaining();
                    battleLog.append(String.format("%s was defeated!\n", target.getName()));
                }
            }
        } 
        // Enemy's turn
        else {
            for (Mob enemy : enemies) {
                if (enemy.getHealth() > 0) {
                    // Simple AI - attack random party member
                    Person target = getRandomAlivePartyMember();
                    if (target != null) {
                        int damage = calculateEnemyDamage(enemy, target);
                        target.setHealth(target.getHealth() - damage);
                        
                        battleLog.append(String.format("%s attacked %s for %d damage!\n", 
                            enemy.getName(), target.getName(), damage));
                            
                        // Check if party member defeated
                        if (target.getHealth() <= 0) {
                            target.setHealth(0);
                            alive();
                            battleLog.append(String.format("%s was defeated!\n", target.getName()));
                            
                            // Switch to another party member if current is defeated
                            if (target.equals(current)) {
                                current = getFirstAlivePartyMember();
                                if (current == null) {
                                    battleLog.append("Your entire party was defeated!\n");
                                    return battleLog.toString();
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Check battle conditions
        if (remaining <= 0) {
            battleLog.append("You defeated all enemies! Victory!\n");
            return battleLog.toString();
        }
        
        if (alive <= 0) {
            battleLog.append("Your party was defeated. Game Over!\n");
            return battleLog.toString();
        }
        
        // Switch turns based on speed
        playerTurn = !playerTurn;
        if (playerTurn) {
            battleLog.append("It's your turn!\n");
        } else {
            battleLog.append("Enemy's turn!\n");
        }
        
        return battleLog.toString();
    }

    private int calculateDamage(Attack attack, Person attacker, Mob target) {
        // Physical damage component
        double physicalDamage = attacker.getStrength() * (attack.getPower() / 100.0);
        // Magic damage component
        double magicDamage = attacker.getMagic() * (attack.magicPower() / 100.0);
        // Total damage before defense
        double totalDamage = physicalDamage + magicDamage;
        // Apply defense reduction
        double defenseFactor = 1.0 - (target.getDefense() / 100.0);
        defenseFactor = Math.max(0.1, defenseFactor); // Ensure at least 10% damage gets through
        
        return (int) (totalDamage * defenseFactor);
    }

    private int calculateEnemyDamage(Mob attacker, Person target) {
        // Simple enemy damage calculation
        double defenseFactor = 1.0 - (target.getDefense() / 100.0);
        defenseFactor = Math.max(0.1, defenseFactor);
        return (int) (attacker.getStrength() * defenseFactor);
    }

    private Person getRandomAlivePartyMember() {
        List<Person> aliveMembers = new ArrayList<>();
        for (Person member : party) {
            if (member.getHealth() > 0) {
                aliveMembers.add(member);
            }
        }
        return aliveMembers.isEmpty() ? null : 
               aliveMembers.get(random.nextInt(aliveMembers.size()));
    }

    private Person getFirstAlivePartyMember() {
        for (Person member : party) {
            if (member.getHealth() > 0) {
                return member;
            }
        }
        return null;
    }

    // Getters for current battle state
    public Person getCurrentCharacter() {
        return current;
    }

    public Mob[] getEnemies() {
        return enemies;
    }

    public boolean isPlayerTurn() {
        return playerTurn;
    }

    public boolean isBattleOver() {
        return remaining <= 0 || alive <= 0;
    }

    public boolean isVictory() {
        return remaining <= 0;
    }
    public void switchCharacter(int characterIndex) {
    if (characterIndex >= 0 && characterIndex < party.length 
            && party[characterIndex].getHealth() > 0) {
        current = party[characterIndex];
    }
    }

    public void useItem(int itemIndex) {
        // Implement item usage logic
    }
}