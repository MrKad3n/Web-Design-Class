// Battle animations
function animateAttack(attacker, target) {
    $(attacker).addClass('attack-animation');
    setTimeout(() => {
        $(target).addClass('hit-animation');
        setTimeout(() => {
            $(attacker).removeClass('attack-animation');
            $(target).removeClass('hit-animation');
        }, 500);
    }, 300);
}

// AJAX for battle actions
function performAttack(attackSlot, targetIndex) {
    animateAttack('#player', `#enemy-${targetIndex}`);
    
    $.post(`/battle/attack?attackSlot=${attackSlot}&targetIndex=${targetIndex}`, 
        function(data) {
            $('#battle-log').html(data.battleLog);
            updateBattleState(data);
        });
}

function updateBattleState(data) {
    // Update HP bars, etc.
    data.enemies.forEach((enemy, i) => {
        $(`#enemy-${i}-hp`).css('width', `${enemy.healthPercent}%`);
    });
}