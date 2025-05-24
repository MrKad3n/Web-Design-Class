class BattleAnimator {
    static animateAttack(attacker, target) {
        $(attacker).addClass('attack-animation');
        setTimeout(() => {
            $(target).addClass('hit-animation');
            setTimeout(() => {
                $(attacker).removeClass('attack-animation');
                $(target).removeClass('hit-animation');
            }, 500);
        }, 300);
    }

    static showDamageNumber(target, amount) {
        const damageElement = $(`<div class="damage-number">${amount}</div>`);
        $(target).append(damageElement);
        damageElement.fadeOut(1000, () => damageElement.remove());
    }
}

// AJAX Battle Handler
$('.attack-button').click(function() {
    const attackSlot = $(this).data('slot');
    const targetIndex = $(this).data('target');
    
    BattleAnimator.animateAttack('#player', `#enemy-${targetIndex}`);
    
    $.post(`/battle/attack`, 
        { attackSlot, targetIndex },
        function(response) {
            updateBattleState(response);
        });
});