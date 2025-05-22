public class BattleTest {
    
    @Test
    public void testDamageCalculation() {
        Person player = new Person("Test");
        Mob enemy = new Mob("unknown", 1, 1);
        
        Attack testAttack = new Attack("Slash", 100, 0, 0, 0, 0);
        Battle battle = new Battle(new Person[]{player}, new Mob[]{enemy});
        
        int damage = battle.calculateDamage(testAttack, player, enemy);
        assertTrue(damage > 0);
    }
}